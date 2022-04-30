import { google } from 'googleapis';

import { Log } from '../log.js';
import { Config } from '../config.js';
import { Common } from '../common.js';
import { Prompt } from '../prompt.js';
import { Archive } from '../archive.js';

class YouTube {

    constructor(database) {
        this.database = database;
        this.youtube = google.youtube('v3');
        this.keyFilePool = Config.youtubeAuth;
        this.keyFilePoolIndex = 0;
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

    async getAnimeBySeasons(config) {
        Log.warn('youtube : seasons command is not supported : see --help for more information');
    }

    async getAnimeByPersonalList(config) {
        Log.warn('youtube : personal command is not supported : see --help for more information');
    }
    
    async getAnimeByScout(config) {
        Log.warn('youtube : scout command is not supported : see --help for more information');
    }

    async getAnimeThemes(config) {
        Log.warn('youtube : themes command is not supported : see --help for more information');
    }

    async getMedias(criteria) {

        let mediaList = [];

        let themes = await this.database.getThemes(criteria);
        
        this.auth();

        for (let themesIndex = 0; themesIndex < themes.length; themesIndex++) {
            
            const currentTheme = themes[themesIndex];

            Log.info(`youtube : searching media results : [ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ]`);
            
            let searchResults = [];

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

                    // quota exeeded
                    if (response.status === 403) { 

                        let mustReAuth = await Prompt.askConfirmation(`[ 403 ] status received. proceed with the reauthentication ?`);
            
                        if (mustReAuth) {
                            this.auth();
                            index--; // retry current index
                        }                        
                    }
                }
            } catch (error) {
                Log.error(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${error.message}`);
            }

            if (searchResults.length > 0) {

                Log.info(`youtube : listing video details : [ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ]`);
            
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
    
                    if (response.status === 403) { // quota exeeded
                        if (keyFilePoolIndex < keyFilePool.length) {
                            keyFilePoolIndex++;
                            this.auth(keyFilePool[keyFilePoolIndex]);
                        }
                        index--; // retry
                    }

                    if (response.status === 200) {

                        let items = response.data.items;
                        
                        let searchMediaList = [];

                        for (let index = 0; index < items.length; index++) {
                    
                            let detailInfo = this.parseDetail(items[index], index);

                            detailInfo.theme = {
                                id: currentTheme.ThemeId
                            };

                            detailInfo.youtube.rank = this.calculateRank(detailInfo, currentTheme);
                
                            searchMediaList.push(detailInfo);
                        }

                        mediaList.push.apply(mediaList, this.selectBestRank(searchMediaList));

                    } else {
                        Log.warn(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${response}`);
                    }
                } catch (error) {
                    Log.error(`[ ${currentTheme.ThemeArtist} - ${currentTheme.ThemeTitle} ] : ${error.message}`);
                }
            }
            
            await Common.sleep(criteria.delay);
        }

        Archive.save(mediaList, 'youtube_medias');

        return mediaList;
    }

    async saveAnime(animes) {
        Log.warn('youtube : seasons command is not supported : see --help for more information');
    }
    
    async savePersonal(animes) {
        Log.warn('youtube : personal command is not supported : see --help for more information');
    }

    async saveScout(animes) {
        Log.warn('youtube : scout command is not supported : see --help for more information');
    }

    async saveThemes(animes) {
        Log.warn('youtube : themes command is not supported : see --help for more information');
    }

    async saveMedias(medias) {
        Log.info(`youtube : saving medias : [ ${medias.length} entries ]`);
        await this.database.saveMedias(medias);
    }

    parseDetail(info, index) {
        let item = {
            youtube: {
                keyId: info.id,
                title: info.snippet.title,
                description: info.snippet.description,
                duration: info.contentDetails.duration,
                durationSeconds: Common.convertISO8601ToSeconds(info.contentDetails.duration),
                numberOfViews: info.statistics.viewCount,
                numberOfLikes: info.statistics.likeCount,
                isLicensed: info.contentDetails.licensedContent,
                isFirstResult: index === 0,
                isBestRank: false,
                rank: 0,
                address: `https://www.youtube.com/watch?v=${info.id}`
            }
        };
        Log.trace(`youtube : parsed media entry : [ ${item.youtube.keyId}, ${item.youtube.title} ]`);
        return item;
    }

    calculateRank(detailInfo, currentTheme) {

        let lengthLowerThreshold = 120;
        let lengthUpperThreshold = 480;

        let finalRank = detailInfo.youtube.rank;

        // overranks licensed videos 
        if (detailInfo.youtube.licensed === true && 
            detailInfo.youtube.durationSeconds >= lengthLowerThreshold && 
            detailInfo.youtube.durationSeconds <= lengthUpperThreshold && 
            detailInfo.youtube.views >= 100000) {
            finalRank += 5;
        }
        
        // ranks videos over threshold and underanks short videos
        if (detailInfo.youtube.durationSeconds >= lengthLowerThreshold && 
            detailInfo.youtube.durationSeconds <= lengthUpperThreshold) {
            finalRank += 1;
        } else {
            finalRank -= 5;
        }

        // ransks first video
        if (detailInfo.youtube.first) {
            finalRank += 1;
        }

        // ranks videos over 100K views
        if (detailInfo.youtube.views >= 100000) {
            finalRank += 1;
        }

        // ranks videos over 1K likes
        if (detailInfo.youtube.likes >= 1000) {
            finalRank += 1;
        }

        // ranks videos with artist / music on title or 
        if (detailInfo.youtube.title.search(new RegExp(currentTheme.ThemeTitle, "i")) != -1 || 
            detailInfo.youtube.title.search(new RegExp(currentTheme.ThemeArtist, "i")) != -1) {
            finalRank += 1;
        }

        // down-ranks videos with TV on title / description
        if (detailInfo.youtube.title.search(new RegExp("TV", "i")) != -1) {
            finalRank -= 1;
        }
        
        // down-ranks videos with SHORT on title / description
        if (detailInfo.youtube.title.search(new RegExp("SHORT", "i")) != -1) {
            finalRank -= 1;
        }

        // down-ranks videos with SHORT on title / description
        if (detailInfo.youtube.title.search(new RegExp("COVER", "i")) != -1) {
            finalRank -= 5;
        }

        return finalRank;
    }

    selectBestRank(mediaList) {
        if (mediaList) {
            mediaList.sort((first, second) => {
                if (first.youtube.rank === second.youtube.rank) {
                    return second.youtube.numberOfViews - first.youtube.numberOfViews;
                }
                return second.youtube.rank - first.youtube.rank;
            })
            mediaList[0].youtube.isBestRank = true;
        }
        return mediaList;
    }
}

export { YouTube };