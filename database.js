import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { Log } from './log.js';
import { Prompt } from './prompt.js';

class Database {

    constructor(databasePath) {
        this.databasePath = path.resolve(databasePath);
    }

    async init() {
        this.database = await open({
            filename: this.databasePath,
            driver: sqlite3.Database
        });
        Log.info(`database : connection opened : [ ${this.databasePath} ]`);
    }

    async begin() {
        this.database.run("begin transaction");
    }

    async commit() {
        this.database.run("commit");
    }
    
    async rollback() {
        this.database.run("rollback");
    }

    async select(config) {
        return this.database.get(config.query, config.params)
    }
    
    async selectAll(config) {
        return this.database.all(config.query, config.params)
    }

    async exec(config) {
        return this.database.run(config.query, config.params)
    }

    async getAniList(criteria) {
        try {

            const result = await this.selectAll({
                query: `${criteria.base} ${criteria.criteria}`
            });

            if (result.length > 0) {
                return result;
            }

        } catch (error) {
            Log.error(`database : error scouting anilist : [ ${criteria} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }

        return [];
    }

    async getMyAnimeList(criteria) {
        try {

            const result = await this.selectAll({
                query: `${criteria.base} ${criteria.criteria}`
            });

            if (result.length > 0) {
                return result;
            }

        } catch (error) {
            Log.error(`database : error scouting anilist : [ ${criteria} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }

        return [];
    }

    async createSource(externalId, sourceType) {
        
        let currentSourceType = await this.select({
            query: `SELECT Id, Key, Name FROM SourceType WHERE Key = ?`, 
            params: [
                sourceType.key
            ]
        });

        if (currentSourceType === undefined) {

            let mustCreate = await Prompt.askConfirmation(`[ ${sourceType.key} : ${sourceType.name} ] source type not found in the database. must be created ? otherwise anime data will be lost`);
            
            if (mustCreate) {
                let newSourceType = await this.exec({
                    query: `INSERT INTO SourceType VALUES (NULL, ?, ?)`,
                    params: [
                        sourceType.key,
                        sourceType.name
                    ]
                });

                currentSourceType = {
                    Id : newSourceType.lastID,
                    Key: sourceType.key,
                    Name: sourceType.name
                };
            }
            else {
                Log.warn(`database : [ ${sourceType.key} : ${sourceType.name} ] source type was not created and anime data was not commited to the database`);
                return undefined;
            }
        }

        try {
            await this.exec({
                query: `INSERT INTO Source VALUES (NULL, ?, ?, ?)`,
                params: [
                    `${currentSourceType.Key}-${externalId}`,
                    externalId,
                    currentSourceType.Id,
                ]
            });

        } catch (error) {
            Log.error(`database : error updating source : [ ${externalId}, ${sourceType.key}, ${sourceType.name} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }
    }

    async saveAniList(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {
            
            const currentAnime = animes[animeIndex];
            
            try {

                const currentExists = await this.select({
                    query: `SELECT Id FROM AniList WHERE Id = ?`, 
                    params: [ currentAnime.id ]
                });
                
                if (currentExists) {

                    await this.exec({
                        query: `UPDATE AniList SET Title = ?, Type = ?, Format = ?, Season = ?, SeasonYear = ?, Genres = ?, NumberOfEpisodes = ?, StartDate = ?, StartWeekNumber = ?, StartDayOfWeek = ?, HasPrequel = ?, HasSequel = ?, Status = ?, SiteUrl = ? WHERE Id = ?`, 
                        params: [
                            currentAnime.title,
                            currentAnime.type,
                            currentAnime.format,
                            currentAnime.season,
                            currentAnime.seasonYear,
                            currentAnime.genres,
                            currentAnime.numberOfEpisodes,
                            currentAnime.startDate,
                            currentAnime.startWeekNumber,
                            currentAnime.startDayOfWeek,
                            currentAnime.hasPrequel,
                            currentAnime.hasSequel,
                            currentAnime.status,
                            currentAnime.siteUrl,
                            currentAnime.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO AniList (Id, Title, Type, Format, Season, SeasonYear, Genres, NumberOfEpisodes, StartDate, StartWeekNumber, StartDayOfWeek, HasPrequel, HasSequel, Status, SiteUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        params: [
                            currentAnime.id,
                            currentAnime.title,
                            currentAnime.type,
                            currentAnime.format,
                            currentAnime.season,
                            currentAnime.seasonYear,
                            currentAnime.genres,
                            currentAnime.numberOfEpisodes,
                            currentAnime.startDate,
                            currentAnime.startWeekNumber,
                            currentAnime.startDayOfWeek,
                            currentAnime.hasPrequel,
                            currentAnime.hasSequel,
                            currentAnime.status,
                            currentAnime.siteUrl
                        ]
                    });
                    await this.createSource(currentAnime.id, { key: "ANI", name: "AniList" });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating anilist : [ ${currentAnime.id}, ${currentAnime.title} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : anilist updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }

    async savePersonal(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };
        
        await this.begin();

        try {

            let user = await this.select({
                query: `SELECT Id FROM User WHERE Name = ?`, 
                params: [ animes[0].userName ]
            });

            if (user === undefined) {

                let mustCreate = await Prompt.askConfirmation(`[ ${animes[0].userName} ] user not found in the database. must be created ? otherwise personal data will be lost`);
                
                if (mustCreate) {
                    let newUser = await this.exec({
                        query: `INSERT INTO User VALUES (NULL, ?)`,
                        params: [
                            animes[0].userName
                        ]
                    });

                    user = {
                        Id : newUser.lastID
                    };
                }
                else {
                    Log.warn(`database : [ ${animes[0].userName} ] user was not created and personal data was not commited to the database`);
                    
                    await this.commit();
                    return;
                }
            }

            let cleanupResult = await this.exec({
                query: `DELETE FROM Personal WHERE UserId = ?`,
                params: [
                    user.Id
                ]
            });
            execResults.deleted += cleanupResult.changes;

            for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {
                
                const currentAnime = animes[animeIndex];
                
                try {
                    await this.exec({
                        query: `INSERT INTO Personal (UserId, AniListId, Status) VALUES (?, ?, ?)`,
                        params: [
                            user.Id,
                            currentAnime.id,
                            currentAnime.personalStatus
                        ]
                    });
                    execResults.added++;
                } catch (error) {
                    Log.error(`database : error updating personal : [ ${currentAnime.userName}, ${currentAnime.id}, ${currentAnime.title} ]`);
                    Log.error(error.message);
                    Log.error(error.stack);
                    execResults.errors++;
                }
            }

            await this.commit();

            Log.info(`database : personal updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);

        } catch (error) {
            Log.error(`database : error updating personal : [ ${animes[0].userName} ]`);
            Log.error(error.message);
            Log.error(error.stack);
            await this.rollback();
        }
    }

    async saveMyAnimeList(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {
            
            const currentAnime = animes[animeIndex];
            
            try {

                const currentExists = await this.select({
                    query: `SELECT Id FROM MyAnimeList WHERE Id = ?`, 
                    params: [ currentAnime.id ]
                });
                
                if (currentExists) {

                    await this.exec({
                        query: `UPDATE MyAnimeList SET Title = ?, Type = ?, Season = ?, SeasonYear = ?, NumberOfEpisodes = ?, StartDate = ?, EndDate = ?, Status = ? WHERE Id = ?`, 
                        params: [
                            currentAnime.title,
                            currentAnime.type,
                            currentAnime.season,
                            currentAnime.seasonYear,
                            currentAnime.numberOfEpisodes,
                            currentAnime.startDate,
                            currentAnime.endDate,
                            currentAnime.status,
                            currentAnime.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO MyAnimeList (Id, Title, Type, Season, SeasonYear, NumberOfEpisodes, StartDate, EndDate, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        params: [
                            currentAnime.id,
                            currentAnime.title,
                            currentAnime.type,
                            currentAnime.season,
                            currentAnime.seasonYear,
                            currentAnime.numberOfEpisodes,
                            currentAnime.startDate,
                            currentAnime.endDate,
                            currentAnime.status
                        ]
                    });
                    await this.createSource(currentAnime.id, { key: "MAL", name: "MyAnimeList" });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating myanimelist : [ ${currentAnime.id}, ${currentAnime.title} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : myanimelist updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }

    async saveScout(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {
            
            const currentAnime = animes[animeIndex];
            
            try {

                const currentExists = await this.select({
                    query: `SELECT AniListId FROM AniList_MyAnimeList WHERE AniListId = ?`, 
                    params: [ currentAnime.aniListId ]
                });
                
                if (currentExists) {

                    await this.exec({
                        query: `UPDATE AniList_MyAnimeList SET MyAnimeListId = ? WHERE AniListId = ?`, 
                        params: [
                            currentAnime.id,
                            currentAnime.aniListId
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO AniList_MyAnimeList (AniListId, MyAnimeListId) VALUES (?, ?)`,
                        params: [
                            currentAnime.aniListId,
                            currentAnime.id
                        ]
                    });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating scout : [ ${currentAnime.id}, ${currentAnime.title} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : scout updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }
}

export { Database };