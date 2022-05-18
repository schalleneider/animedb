import axios from 'axios';
import axiosRetry from 'axios-retry';

import { Facade } from './facade.js';

import { Log } from '../log.js';
import { Common } from '../common.js';
import { Archive } from '../archive.js';

class AniList extends Facade {

    constructor(database) {
        super(database);
    }

    async getAnimeBySeasons(criteria) {

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

        for (let seasonIndex = 0; seasonIndex < criteria.list.length; seasonIndex++) {
            
            const currentSeason = criteria.list[seasonIndex];

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

        Archive.save(animeList, 'anilist_seasons');

        return animeList;
    }

    async getAnimeByPersonalList(criteria) {

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

        Archive.save(animeList, `anilist_personal_${criteria.userName}`, false);

        return animeList;
    }

    async getAnimeByPickList(criteria) {
        
        let animeList = [];

        let baseUrl = "https://graphql.anilist.co/api/v2/";
    
        let graphql = `query GetAnime($id: Int) {
            Media(id: $id) {
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
        }`;

        for (let identifierIndex = 0; identifierIndex < criteria.list.length; identifierIndex++) {
            
            const currentIdentifier = criteria.list[identifierIndex];

            Log.info(`anilist : getting anime pick : [ ${currentIdentifier.aniListId} ]`);

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
                        id: parseInt(currentIdentifier.aniListId)
                    }
                }
            };

            const response = await axios(config);

            let parsedResponse = this.parseAnimeByMediaResponse(response.data);

            parsedResponse.myanimelist = {
                id: currentIdentifier.myAnimeListId
            };

            animeList = animeList.concat(parsedResponse);
            
            await Common.sleep(criteria.delay);
        }

        Archive.save(animeList, 'anilist_animepick');

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

    async saveAnimePick(animes) {
        Log.info(`anilist : saving anime pick : [ ${animes.length} entries ]`);
        await this.database.saveAniList(animes);
    }

    parseAnimeMedia(media) {
        let currentMediaStartMoment = Common.getMoment(media.startDate.year + '-' + media.startDate.month + '-' + media.startDate.day);
        if (!currentMediaStartMoment.isValid()) {
            currentMediaStartMoment = null;
        }
        let item = {
            anilist: {
                id: media.id,
                title: media.title.romaji,
                type: media.type,
                format: media.format,
                season: media.season,
                seasonYear: media.seasonYear,
                genres: media.genres.join(','),
                numberOfEpisodes: media.episodes,
                startDate: currentMediaStartMoment?.format("YYYY-MM-DD"),
                startWeekNumber: currentMediaStartMoment?.format("W"),
                startDayOfWeek: currentMediaStartMoment?.format("dddd"),
                hasPrequel: Common.hasPrequel(media.relations.edges),
                hasSequel: Common.hasSequel(media.relations.edges),
                status: media.status,
                address: media.siteUrl
            }
        };
        return item;
    }

    parseAnimeBySeasonsResponse(response) {
        let parsedResponse = [];
        let mediaList = [...response.data.Page.media];
        for (let index = 0; index < mediaList.length; index++) {
            let currentMedia = mediaList[index];
            // anilist properties
            let item = this.parseAnimeMedia(currentMedia);
            // push parsed item
            parsedResponse.push(item);
            Log.trace(`anilist : parsed anime entry : [ ${item.anilist.id}, ${item.anilist.title}, ${item.anilist.season}, ${item.anilist.seasonYear} ]`);
        }
        return parsedResponse;
    }

    parseAnimeByMediaResponse(response) {
        let item = this.parseAnimeMedia(response.data.Media);
        Log.trace(`anilist : parsed anime entry : [ ${item.anilist.id}, ${item.anilist.title}, ${item.anilist.season}, ${item.anilist.seasonYear} ]`);
        return item;
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
                // anilist properties
                let item = this.parseAnimeMedia(currentMedia);
                // personal properties
                item.personal = { 
                    status: currentEntry.status,
                    userName: userName
                };
                // push parsed item
                parsedResponse.push(item);
                Log.trace(`anilist : parsed anime entry : [ ${userName}, ${item.anilist.id}, ${item.anilist.title}, ${item.personal.status} ]`);
            }
        }
        return parsedResponse;
    }
}

export { AniList };