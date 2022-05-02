import fs from 'fs';
import axios from 'axios';
import axiosRetry from 'axios-retry';

import { Log } from '../log.js';
import { Config } from '../config.js';
import { Common } from '../common.js';
import { Archive } from '../archive.js';

class MyAnimeList {

    constructor(database) {
        this.database = database;
        this.auth = Config.parsedMyAnimeListAuth();
    }

    async getAnimeBySeasons(criteria) {

        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime/season";

        for (let seasonIndex = 0; seasonIndex < criteria.list.length; seasonIndex++) {
            
            const currentSeason = criteria.list[seasonIndex];

            Log.info(`myanimelist : getting anime season : [ ${currentSeason.season}, ${currentSeason.year} ]`);

            let authHeader = JSON.parse(`{ "${this.auth.header}" : "${this.auth.value}" }`);

            let seasonContent = [];

            let hasNextPage = true;
            let offset = 0;
            let limit = 100;

            while (hasNextPage) {

                axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

                const config = {
                    url: `${baseUrl}/${currentSeason.year}/${currentSeason.season}`,
                    method: 'GET',
                    headers: authHeader,
                    params: {
                        offset : offset,
                        limit: limit,
                        nsfw: true,
                        fields: 'id,title,start_date,end_date,media_type,status,num_episodes,start_season'
                    }
                };

                const response = await axios(config);

                let parsedResponse = this.parseAnimeResponse(response.data);

                seasonContent = seasonContent.concat(parsedResponse);

                if (response.data.next != undefined) {
                    offset += limit;
                } else {
                    hasNextPage = false;
                }
            }

            animeList = animeList.concat(seasonContent);
            
            await Common.sleep(criteria.delay);
        }

        Archive.save(animeList, 'myanimelist_seasons');

        return animeList;
    }

    async getAnimeByPickList(criteria) {
        
        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime";
        
        for (let identifierIndex = 0; identifierIndex < criteria.list.length; identifierIndex++) {
            
            const currentIdentifier = criteria.list[identifierIndex];

            Log.info(`anilist : getting myanimelist pick : [ ${currentIdentifier.myAnimeListId} ]`);

            let authHeader = JSON.parse(`{ "${this.auth.header}" : "${this.auth.value}" }`);

            axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

            const config = {
                url: `${baseUrl}/${currentIdentifier.myAnimeListId}`,
                method: 'GET',
                headers: authHeader,
                params: {
                    fields: 'id,title,start_date,end_date,media_type,status,num_episodes,start_season'
                }
            };

            try {
                
                const response = await axios(config);

                let parsedResponse = this.parseAnimePickResponse(response.data);

                parsedResponse.anilist = {
                    id: currentIdentifier.aniListId
                };

                animeList = animeList.concat(parsedResponse);

            } catch (error) {
                if (error.isAxiosError) {
                    Log.warn(`[ ${currentIdentifier.myAnimeListId} ] : ${JSON.stringify(error.response.data)}`);
                } else {
                    Log.error(`[ ${currentIdentifier.myAnimeListId} ] : ${error.message}`);
                }
            }

            await Common.sleep(criteria.delay);
        }

        Archive.save(animeList, 'myanimelist_pick');

        return animeList;
    }

    async getAnimeByPersonalList(config) {
        Log.warn('myanimelist : personal command is not supported : see --help for more information');
    }
    
    async getAnimeByScout(criteria) {
        
        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime";

        let entries = await this.database.getAniList(criteria);
        
        for (let aniListIndex = 0; aniListIndex < entries.length; aniListIndex++) {
            
            const currentEntry = entries[aniListIndex];

            let query = currentEntry.AniListTitle.replace(/[^\w\s]/gi, '').substring(0, criteria.queryLengthLimit);

            Log.info(`myanimelist : scouting anime : [ ${currentEntry.AniListTitle}, ${currentEntry.AniListStartDate} ]`);

            let authHeader = JSON.parse(`{ "${this.auth.header}" : "${this.auth.value}" }`);

            axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

            const config = {
                url: baseUrl,
                method: 'GET',
                headers: authHeader,
                params: {
                    q : query,
                    limit: 20,
                    fields: 'id,title,start_date,end_date,media_type,status,num_episodes,start_season'
                }
            };

            try {
                
                const response = await axios(config);

                let parsedResponse = this.parseAnimeResponse(response.data);

                let filteredContent = parsedResponse.find((item) => {
                    let diff = Common.subtractMoments(Common.getMoment(item.myanimelist.startDate), Common.getMoment(currentEntry.AniListStartDate), "days");
                    return Math.abs(diff) <= criteria.startDateOffsetLimit;
                });

                if (filteredContent) {
                    filteredContent.anilist = {
                        id: currentEntry.AniListId
                    };
                    animeList = animeList.concat(filteredContent);
                } else {
                    Log.warn(`myanimelist : no valid animes scouted : [ ${query},  ${currentEntry.AniListStartDate} ]`);
                }
            } catch (error) {
                if (error.isAxiosError) {
                    Log.warn(`[ ${query} ] : ${JSON.stringify(error.response.data)}`);
                } else {
                    Log.error(`[ ${query} ] : ${error.message}`);
                }
            }
            
            await Common.sleep(criteria.delay);
        }

        Archive.save(animeList, 'myanimelist_scout');

        return animeList;
    }

    async getAnimeThemes(criteria) {

        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime";

        let entries = await this.database.getMyAnimeList(criteria);
        
        for (let myAnimeListIndex = 0; myAnimeListIndex < entries.length; myAnimeListIndex++) {
            
            const currentEntry = entries[myAnimeListIndex];

            Log.info(`myanimelist : getting anime themes : [ ${currentEntry.MyAnimeListTitle} ]`);

            let authHeader = JSON.parse(`{ "${this.auth.header}" : "${this.auth.value}" }`);

            axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

            const config = {
                url: `${baseUrl}/${currentEntry.MyAnimeListId}`,
                method: 'GET',
                headers: authHeader,
                params: {
                    fields: 'id,title,start_date,end_date,media_type,status,num_episodes,start_season,opening_themes,ending_themes'
                }
            };

            try {
                
                const response = await axios(config);

                let parsedResponse = this.parseAnimeThemesResponse(response.data);

                animeList = animeList.concat(parsedResponse);

            } catch (error) {
                if (error.isAxiosError) {
                    Log.warn(`[ ${currentEntry.MyAnimeListTitle} ] : ${JSON.stringify(error.response.data)}`);
                } else {
                    Log.error(`[ ${currentEntry.MyAnimeListTitle} ] : ${error.message}`);
                }
            }

            await Common.sleep(criteria.delay);
        }

        Archive.save(animeList, 'myanimelist_themes');

        return animeList;
    }
    
    async getMedias(config) {
        Log.warn('myanimelist : medias command is not supported : see --help for more information');
    }
    
    async saveAnime(animes) {
        Log.info(`myanimelist : saving anime : [ ${animes.length} entries ]`);
        await this.database.saveMyAnimeList(animes);
    }
    
    async savePick(animes) {
        Log.info(`myanimelist : saving pick anime : [ ${animes.length} entries ]`);
        await this.database.saveMyAnimeList(animes);
        await this.database.saveScout(animes);
    }

    async savePersonal(animes) {
        Log.warn('myanimelist : personal command is not supported : see --help for more information');
    }

    async saveScout(animes) {
        Log.info(`myanimelist : saving scouted anime : [ ${animes.length} entries ]`);
        await this.database.saveMyAnimeList(animes);
        await this.database.saveScout(animes);
    }

    async saveThemes(animes) {
        Log.info(`myanimelist : saving anime themes : [ ${animes.length} entries ]`);
        await this.database.saveMyAnimeList(animes);
        await this.database.saveThemes(animes);
    }

    async saveMedias(medias) {
        Log.warn('myanimelist : medias command is not supported : see --help for more information');
    }

    parseAnimeNode(node) {
        let item = {
            myanimelist: {
                id: node.id,
                title: node.title,
                type: node?.media_type.toUpperCase(),
                season: node.start_season?.season.toUpperCase(),
                seasonYear: node.start_season?.year,
                numberOfEpisodes: node.num_episodes,
                startDate: node.start_date,
                endDate: node.end_date,
                status: node?.status.toUpperCase()
            }
        };
        return item;
    }

    parseAnimeResponse(response) {
        let parsedResponse = [];
        let dataList = [...response.data];
        for (let index = 0; index < dataList.length; index++) {
            let currentNode = dataList[index].node;
            // myanimelist properties
            let item = this.parseAnimeNode(currentNode);
            // push parsed item
            switch (item.myanimelist.type) {
                case 'TV':
                case 'OVA':
                case 'MOVIE':
                case 'SPECIAL':
                case 'ONA':
                    parsedResponse.push(item);
                    break;
            
                default:
                    break;
            }
            Log.trace(`myanimelist : parsed anime entry : [ ${item.myanimelist.id}, ${item.myanimelist.title}, ${item.myanimelist.season}, ${item.myanimelist.seasonYear} ]`);
        }
        return parsedResponse;
    }

    parseAnimePickResponse(response) {
        // myanimelist properties
        let item = this.parseAnimeNode(response);
        Log.trace(`myanimelist : parsed anime entry : [ ${item.myanimelist.id}, ${item.myanimelist.title}, ${item.myanimelist.season}, ${item.myanimelist.seasonYear} ]`);
        return item;
    }

    parseAnimeThemesResponse(response) {
        // myanimelist properties
        let item = this.parseAnimeNode(response);
        // themes properties
        item.themes = {
            openings: Common.parseAnimeThemes(response.opening_themes, "OPENING"),
            endings: Common.parseAnimeThemes(response.ending_themes, "ENDING")
        };
        Log.trace(`myanimelist : parsed anime entry : [ ${item.myanimelist.id}, ${item.myanimelist.title}, ${item.myanimelist.season}, ${item.myanimelist.seasonYear} ]`);
        return item;
    }
}

export { MyAnimeList };