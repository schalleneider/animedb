import { google } from 'googleapis';

import { Facade } from './facade.js';

import { Log } from '../log.js';
import { Config } from '../config.js';
import { Common } from '../common.js';
import { Prompt } from '../prompt.js';
import { Archive } from '../archive.js';

class YouTube extends Facade {

    constructor(database) {
        super(database);
        this.youtube = google.youtube('v3');
        this.autoReAuth = Config.youtubeAutoReAuth;
        this.keyFilePool = Config.youtubeAuth;
        this.keyFilePoolIndex = 0;
    }

    async getMedias(criteria) {

        let mediaList = [];

        let themes = await this.database.getThemes(criteria);
        
        this.auth();

        for (let themesIndex = 0; themesIndex < themes.length; themesIndex++) {
            
            const currentTheme = themes[themesIndex];

            Log.info(`youtube : searching media results : [ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ]`);
            
            let searchResults = [];
            let searchResultsCompleted = false;

            while (!searchResultsCompleted) {

                try {

                    const paramsSearch = {
                        part: 'id,snippet',
                        order: 'relevance',
                        type: 'video',
                        q: `${currentTheme.ThemeTitle} ${currentTheme.ThemeArtist}`,
                    };

                    const response = await this.youtube.search.list(paramsSearch);

                    if (response.status === 200) {

                        let items = response.data.items;

                        for (let index = 0; index < items.length; index++) {
                            searchResults.push(items[index].id.videoId);
                        }

                    } else {
                        Log.warn(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${response}`);
                    }

                    searchResultsCompleted = true;

                } catch (error) {
                    Log.error(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${error.message}`);
                    searchResultsCompleted = !(await this.checkForQuota(error));
                }
            }

            if (searchResults.length > 0) {

                Log.info(`youtube : listing video details : [ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ]`);

                let listResultsCompleted = false;
            
                while (!listResultsCompleted) {
                    try {

                        const paramsVideos = {
                            part: [
                                'snippet',
                                'contentDetails',
                                'statistics'
                            ],
                            id: searchResults
                        };
        
                        const response = await this.youtube.videos.list(paramsVideos);

                        if (response.status === 200) {

                            let items = response.data.items;
                            
                            let themeMediaList = [];

                            for (let index = 0; index < items.length; index++) {
                        
                                let detailInfo = this.parseDetail(items[index], index, "SEARCH");

                                detailInfo.rank = this.calculateRank(detailInfo, currentTheme);
                    
                                themeMediaList.push(detailInfo);
                            }

                            mediaList.push({
                                theme: {
                                    id: currentTheme.ThemeId
                                },
                                youtube: this.selectBestRank(themeMediaList)
                            });

                        } else {
                            Log.warn(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${response}`);
                        }

                        listResultsCompleted = true;

                    } catch (error) {
                        Log.error(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${error.message}`);
                        listResultsCompleted = !(await this.checkForQuota(error));
                    }
                }
            } else {
                Log.info(`youtube : no results for media : [ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ]`);
            }
            
            await Common.sleep(criteria.delay);
        }

        Archive.save(mediaList, 'youtube_medias');

        return mediaList;
    }
    
    async getMediaByPickList(criteria) {

        let mediaList = [];

        this.auth();

        for (let identifierIndex = 0; identifierIndex < criteria.list.length; identifierIndex++) {
            
            const currentIdentifier = criteria.list[identifierIndex];

            Log.info(`youtube : getting media pick video details : [ ${currentIdentifier.keyId} ]`);

            let listResultsCompleted = false;
        
            while (!listResultsCompleted) {
                try {

                    const paramsVideos = {
                        part: [
                            'snippet',
                            'contentDetails',
                            'statistics'
                        ],
                        id: [ currentIdentifier.keyId ]
                    };
    
                    const response = await this.youtube.videos.list(paramsVideos);

                    if (response.status === 200) {

                        let items = response.data.items;
                        
                        let themeMediaList = [];

                        for (let index = 0; index < items.length; index++) {
                    
                            let detailInfo = this.parseDetail(items[index], index, "PICK", true, true);

                            detailInfo.rank = this.calculateRank(detailInfo, undefined);
                
                            themeMediaList.push(detailInfo);
                        }

                        mediaList.push({
                            theme: {
                                id: currentIdentifier.themeId
                            },
                            youtube: this.selectBestRank(themeMediaList)
                        });

                    } else {
                        Log.warn(`[ ${currentIdentifier.keyId} ] : ${response}`);
                    }

                    listResultsCompleted = true;

                } catch (error) {
                    Log.error(`[ ${currentIdentifier.keyId} ] : ${error.message}`);
                    listResultsCompleted = !(await this.checkForQuota(error));
                }
            }
            
            await Common.sleep(criteria.delay);
        }

        Archive.save(mediaList, 'youtube_mediapick');

        return mediaList;
    }

    async saveMedias(medias) {
        Log.info(`youtube : saving medias : [ ${medias.length} entries ]`);
        await this.database.saveMedias(medias);
    }
    
    async saveMediaPick(medias) {
        Log.info(`youtube : saving media pick : [ ${medias.length} entries ]`);
        await this.database.saveMedias(medias);
    }

    async auth() {
        const auth = new google.auth.GoogleAuth({
            keyFile: this.keyFilePool[this.keyFilePoolIndex],
            scopes: [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/youtube'
            ],
        });
        google.options({ auth });
        Log.debug(`youtube : currently authenticated with key file [ ${this.keyFilePool[this.keyFilePoolIndex]} ]`);
        this.keyFilePoolIndex++;
    }

    async checkForQuota(error) {
        // quota exeeded
        if (error.code === 403 && error?.errors[0]?.reason === "quotaExceeded") {
            if (this.keyFilePoolIndex < this.keyFilePool.length) {
                let manualReAuth = false;
                if (!this.autoReAuth) {
                    manualReAuth = await Prompt.askConfirmation(`[ quotaExeeded ] response received. proceed with the reauthentication with the next key ?`);
                }
                if (this.autoReAuth || manualReAuth) {
                    this.auth();
                }
                return true;
            } else {
                Log.error('no more keys are available in the pool for reauthentication.');
            }
        }
        return false;
    }

    parseDetail(info, index, searchType, isBestRank = false, isFinalChoice = false) {
        let item = {
            keyId: info.id,
            title: info.snippet.title,
            description: info.snippet.description,
            channel: info.snippet.channelTitle,
            duration: info.contentDetails.duration,
            durationSeconds: Common.convertISO8601ToSeconds(info.contentDetails.duration),
            numberOfViews: info.statistics.viewCount,
            numberOfLikes: info.statistics.likeCount,
            searchSequence: (index + 1),
            isLicensed: info.contentDetails.licensedContent,
            isBestRank: isBestRank,
            isFinalChoice: isFinalChoice,
            rank: 0,
            searchType: searchType,
            address: `https://www.youtube.com/watch?v=${info.id}`
        };
        Log.trace(`youtube : parsed media entry : [ ${item.keyId}, ${item.title} ]`);
        return item;
    }

    calculateRank(detailInfo, currentTheme) {

        let lengthLowerThreshold = 120;
        let lengthUpperThreshold = 480;

        let finalRank = detailInfo.rank;

        // overranks licensed videos 
        if (detailInfo.isLicensed === true && 
            detailInfo.durationSeconds >= lengthLowerThreshold && 
            detailInfo.durationSeconds <= lengthUpperThreshold && 
            detailInfo.views >= 100000) {
            finalRank += 5;
        }
        
        // ranks videos over threshold and underanks short videos
        if (detailInfo.durationSeconds >= lengthLowerThreshold && 
            detailInfo.durationSeconds <= lengthUpperThreshold) {
            finalRank += 1;
        } else {
            finalRank -= 5;
        }

        // ranks videos by sequence
        if (detailInfo.searchSequence) {
            finalRank += 6 - detailInfo.searchSequence;
        }

        // ranks videos over 100K views
        if (detailInfo.numberOfViews >= 100000) {
            finalRank += 1;
        }

        // ranks videos over 1K likes
        if (detailInfo.numberOfLikes >= 1000) {
            finalRank += 1;
        }

        // ranks videos with artist / music on title or 
        if (currentTheme) {
            if (detailInfo.title.search(new RegExp(currentTheme.ThemeTitle, "i")) != -1 || 
                detailInfo.title.search(new RegExp(currentTheme.ThemeArtist, "i")) != -1) {
                finalRank += 1;
            }
        }

        // down-ranks videos with TV on title / description
        if (detailInfo.title.search(new RegExp("TV", "i")) != -1) {
            finalRank -= 1;
        }
        
        // down-ranks videos with SHORT on title / description
        if (detailInfo.title.search(new RegExp("SHORT", "i")) != -1) {
            finalRank -= 1;
        }

        // down-ranks videos with COVER on title / description
        if (detailInfo.title.search(new RegExp("COVER", "i")) != -1) {
            finalRank -= 5;
        }

        return finalRank;
    }

    selectBestRank(mediaList) {
        if (mediaList) {
            mediaList.sort((first, second) => {
                if (first.rank === second.rank) {
                    return second.numberOfViews - first.numberOfViews;
                }
                return second.rank - first.rank;
            })
            mediaList[0].isBestRank = true;
        }
        return mediaList;
    }
}

export { YouTube };