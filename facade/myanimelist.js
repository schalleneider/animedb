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
        this.auth = JSON.parse(fs.readFileSync('auth/myanimelist.json'));
    }

    async getAnimeBySeasons(config, fromArchive = false) {
        if (fromArchive) {
            return this.getAnimeBySeasonsArchive(config)
        } 
        return this.getAnimeBySeasonsAPI(Config.parse(config));
    }

    async getAnimeByPersonalList(config, fromArchive = false) {
        Log.warn('myanimelist : personal command is not supported : see --help for more information');
    }
    
    async getAnimeByScout(config, fromArchive = false) {
        if (fromArchive) {
            return this.getAnimeByScoutArchive(config)
        } 
        return this.getAnimeByScoutAPI(Config.parse(config));
    }

    async getAnimeThemes(config, fromArchive = false) {
        if (fromArchive) {
            return this.getAnimeThemesArchive(config)
        } 
        return this.getAnimeThemesAPI(Config.parse(config));
    }

    async getAnimeBySeasonsArchive(config) {
        Log.debug(`myanimelist : using anime seasons archive : [ ${config} ]`);
        return Config.parse(config);
    }
    
    async getAnimeByScoutArchive(config) {
        Log.debug(`myanimelist : using anime scout archive : [ ${config} ]`);
        return Config.parse(config);
    }
    
    async getAnimeThemesArchive(config) {
        Log.debug(`myanimelist : using anime scout archive : [ ${config} ]`);
        return Config.parse(config);
    }

    async getAnimeBySeasonsAPI(seasons, saveToArchive = true) {

        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime/season";

        for (let seasonIndex = 0; seasonIndex < seasons.length; seasonIndex++) {
            
            const currentSeason = seasons[seasonIndex];

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
        }

        if (saveToArchive) {
            Archive.save(animeList, 'myanimelist_seasons');
        }

        return animeList;
    }

    async getAnimeByScoutAPI(criteria, saveToArchive = true) {

        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime";

        let entries = await this.database.getAniList(criteria);
        
        for (let aniListIndex = 0; aniListIndex < entries.length; aniListIndex++) {
            
            const currentEntry = entries[aniListIndex];

            Log.info(`myanimelist : scouting anime : [ ${currentEntry.Title} ]`);

            let authHeader = JSON.parse(`{ "${this.auth.header}" : "${this.auth.value}" }`);

            axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

            const config = {
                url: baseUrl,
                method: 'GET',
                headers: authHeader,
                params: {
                    q : currentEntry.Title,
                    limit: 3,
                    fields: 'id,title,start_date,end_date,media_type,status,num_episodes,start_season'
                }
            };

            try {
                
                const response = await axios(config);

                let parsedResponse = this.parseAnimeResponse(response.data);

                let filteredContent = parsedResponse.find((item) => item.title === currentEntry.Title);

                if (filteredContent === undefined) {
                    filteredContent = parsedResponse[0];
                }

                filteredContent.aniListId = currentEntry.Id;

                animeList = animeList.concat(filteredContent);

            } catch (error) {
                if (error.isAxiosError) {
                    Log.warn(error.response.data);
                } else {
                    throw error;
                }
            }
        }

        if (saveToArchive) {
            Archive.save(animeList, 'myanimelist_scout');
        }

        return animeList;
    }

    async getAnimeThemesAPI(criteria, saveToArchive = true) {

        let animeList = [];

        let baseUrl = "https://api.myanimelist.net/v2/anime";

        let entries = await this.database.getMyAnimeList(criteria);
        
        for (let aniListIndex = 0; aniListIndex < entries.length; aniListIndex++) {
            
            const currentEntry = entries[aniListIndex];

            Log.info(`myanimelist : getting anime themes : [ ${currentEntry.Title} ]`);

            let authHeader = JSON.parse(`{ "${this.auth.header}" : "${this.auth.value}" }`);

            axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

            const config = {
                url: `${baseUrl}/${currentEntry.Id}`,
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
                    Log.warn(error.response.data);
                } else {
                    throw error;
                }
            }
        }

        if (saveToArchive) {
            Archive.save(animeList, 'myanimelist_themes');
        }

        return animeList;
    }

    async saveAnime(animes) {
        Log.info(`myanimelist : saving anime : [ ${animes.length} entries ]`);
        await this.database.saveMyAnimeList(animes);
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
    }

    parseAnimeNode(node) {
        let item = {
            id : node.id,
            title : node.title,
            type : node.media_type.toUpperCase(),
            season: node.start_season.season.toUpperCase(),
            seasonYear: node.start_season.year,
            numberOfEpisodes: node.num_episodes,
            startDate: node.start_date,
            endDate: node.end_date,
            status: node.status.toUpperCase()
        };
        return item;
    }

    parseAnimeResponse(response) {
        let parsedResponse = [];
        let dataList = [...response.data];
        for (let index = 0; index < dataList.length; index++) {
            let currentNode = dataList[index].node;
            // default properties
            let item = this.parseAnimeNode(currentNode);
            // push parsed item
            switch (item.type) {
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
            Log.trace(`myanimelist : parsed anime entry : [ ${item.id}, ${item.title}, ${item.season}, ${item.seasonYear} ]`);
        }
        return parsedResponse;
    }

    parseAnimeThemesResponse(response) {
        let item = this.parseAnimeNode(response);
        // themes properties
        item.openings = Common.parseAnimeThemes(response.opening_themes, "OPENING");
        item.endings = Common.parseAnimeThemes(response.ending_themes, "ENDING");
        Log.trace(`myanimelist : parsed anime entry : [ ${item.id}, ${item.title}, ${item.season}, ${item.seasonYear} ]`);
        return item;
    }
}

export { MyAnimeList };