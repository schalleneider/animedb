import axios from 'axios';
import axiosRetry from 'axios-retry';

import { Log } from '../log.js';
import { Config } from '../config.js';
import { Common } from '../common.js';
import { Archive } from '../archive.js';

class AniList {

    constructor(database) {
        this.database = database;
    }

    async getAnimeBySeasons(config, fromArchive = false) {
        if (fromArchive) {
            return this.getAnimeBySeasonsArchive(config)
        } 
        return this.getAnimeBySeasonsAPI(Config.parse(config));
    }

    async getAnimeByPersonalList(config, fromArchive = false) {
        if (fromArchive) {
            return this.getAnimeByPersonalListArchive(config)
        } 
        return this.getAnimeByPersonalListAPI(Config.parse(config));
    }

    async getAnimeByScout(config, fromArchive = false) {
        Log.warn('anilist : scout command is not supported : see --help for more information');
    }

    async getAnimeThemes(config, fromArchive = false) {
        Log.warn('anilist : themes command is not supported : see --help for more information');
    }
    
    async getAnimeBySeasonsArchive(config) {
        Log.debug(`anilist : using anime seasons archive : [ ${config} ]`);
        return Config.parse(config);
    }

    async getAnimeByPersonalListArchive(config) {
        Log.debug(`anilist : using anime personal archive : [ ${config} ]`);
        return Config.parse(config);
    }

    async getAnimeBySeasonsAPI(criteria, saveToArchive = true) {

        let animeList = [];

        let baseUrl = "https://graphql.anilist.co/api/v2/";
    
        let graphql = `query GetAnimeList($season: MediaSeason, $seasonYear: Int, $currentPage: Int) {
            Page (perPage: 50, page: $currentPage) {
                pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                    perPage
                }
                media(season: $season, seasonYear: $seasonYear, isAdult: false) {
                    id
                    title {
                        romaji
                    }
                    startDate {
                        year
                        month
                        day
                    }
                    season
                    seasonYear
                    type
                    episodes
                    status
                    siteUrl
                    format
                    genres
                    relations {
                        edges {
                            id
                            relationType
                        }
                    }
                }
            }
        }`;

        for (let seasonIndex = 0; seasonIndex < criteria.seasons.length; seasonIndex++) {
            
            const currentSeason = criteria.seasons[seasonIndex];

            Log.info(`anilist : getting anime season : [ ${currentSeason.season}, ${currentSeason.year} ]`);

            let seasonContent = [];

            let hasNextPage = true;
            let currentPage = 1;

            while (hasNextPage) {

                axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

                const config = {
                    url: baseUrl,
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    data: {
                        query: graphql,
                        variables: { 
                            season: Common.getMediaSesonValue(currentSeason.season),
                            seasonYear: currentSeason.year,
                            currentPage: currentPage 
                        }
                    }
                };

                const response = await axios(config);

                let parsedResponse = this.parseAnimeBySeasonsResponse(response.data);

                seasonContent = seasonContent.concat(parsedResponse);

                hasNextPage = response.data.data.Page.pageInfo.hasNextPage;
                currentPage++;
            }

            animeList = animeList.concat(seasonContent);
            
            await Common.sleep(criteria.delay);
        }

        if (saveToArchive) {
            Archive.save(animeList, 'anilist_seasons');
        }

        return animeList;
    } 

    async getAnimeByPersonalListAPI(criteria, saveToArchive = true) {

        let animeList = [];

        let baseUrl = "https://graphql.anilist.co/api/v2/";
    
        let graphql = `query GetAnimeList($userName: String, $currentChunk: Int) {
            MediaListCollection(userName: $userName, type: ANIME, chunk: $currentChunk, perChunk: 500) {
                hasNextChunk
                user {
                    name
                }
                lists {
                    entries {
                        status
                        media {
                            id
                            title {
                                romaji
                            }
                            startDate {
                                year
                                month
                                day
                            }
                            season
                            seasonYear
                            type
                            episodes
                            status
                            siteUrl
                            format
                            genres
                            relations {
                                edges {
                                    id
                                    relationType
                                }
                            }
                        }
                    }
                }
            }
        }`;

        Log.info(`anilist : getting anime personal : [ ${criteria.userName} ]`);

        let hasNextChunk = true;
        let currentChunk = 1;
        
        while (hasNextChunk) {

            axiosRetry(axios, { retries: 3, retryDelay: (5 * 1000) });

            const config = {
                url: baseUrl,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                data: {
                    query: graphql,
                    variables: { 
                        userName: criteria.userName,
                        currentChunk: currentChunk 
                    }
                }
            };

            const response = await axios(config);

            let parsedResponse = this.parseAnimeByPersonalListResponse(response.data);

            animeList = animeList.concat(parsedResponse);

            hasNextChunk = response.data.data.MediaListCollection.hasNextChunk;
            currentChunk++;

            await Common.sleep(criteria.delay);
        }

        if (saveToArchive) {
            Archive.save(animeList, `anilist_personal_${criteria.userName}`, false);
        }

        return animeList;
    }

    async saveAnime(animes) {
        Log.info(`anilist : saving anime : [ ${animes.length} entries ]`);
        await this.database.saveAniList(animes);
    }
    
    async savePersonal(animes) {
        Log.info(`anilist : saving personal anime : [ ${animes.length} entries ]`);
        await this.database.saveAniList(animes);
        await this.database.savePersonal(animes);
    }

    async saveScout(animes) {
        Log.warn('anilist : scout command is not supported : see --help for more information');
    }
    
    async saveThemes(animes) {
        Log.warn('anilist : themes command is not supported : see --help for more information');
    }

    parseAnimeMedia(media) {
        let currentMediaStartMoment = Common.getMoment(media.startDate.year, media.startDate.month, media.startDate.day);
        let item = {
            id: media.id,
            title: media.title.romaji,
            type: media.type,
            format: media.format,
            season: media.season,
            seasonYear: media.seasonYear,
            genres: media.genres.join(','),
            numberOfEpisodes: media.episodes,
            startDate: currentMediaStartMoment.format("YYYY-MM-DD"),
            startWeekNumber: currentMediaStartMoment.format("W"),
            startDayOfWeek: currentMediaStartMoment.format("dddd"),
            hasPrequel: Common.hasPrequel(media.relations.edges),
            hasSequel: Common.hasSequel(media.relations.edges),
            status: media.status,
            siteUrl: media.siteUrl
        };
        return item;
    }

    parseAnimeBySeasonsResponse(response) {
        let parsedResponse = [];
        let mediaList = [...response.data.Page.media];
        for (let index = 0; index < mediaList.length; index++) {
            let currentMedia = mediaList[index];
            // default properties
            let item = this.parseAnimeMedia(currentMedia);
            // push parsed item
            parsedResponse.push(item);
            Log.trace(`anilist : parsed anime entry : [ ${item.id}, ${item.title}, ${item.season}, ${item.seasonYear} ]`);
        }
        return parsedResponse;
    }

    parseAnimeByPersonalListResponse(response) {
        let parsedResponse = [];
        let userName = response.data.MediaListCollection.user.name;
        let lists = [...response.data.MediaListCollection.lists];
        for (let indexList = 0; indexList < lists.length; indexList++) {
            let currentList = lists[indexList];
            let entries = [...currentList.entries];
            for (let indexEntry = 0; indexEntry < entries.length; indexEntry++) {
                let currentEntry = entries[indexEntry];
                let currentMedia = currentEntry.media;
                // default properties
                let item = this.parseAnimeMedia(currentMedia);
                // custom properties
                item.personalStatus = currentEntry.status;
                item.userName = userName;
                // push parsed item
                parsedResponse.push(item);
                Log.trace(`anilist : parsed anime entry : [ ${userName}, ${item.id}, ${item.title}, ${item.personalStatus} ]`);
            }
        }
        return parsedResponse;
    }
}

export { AniList };