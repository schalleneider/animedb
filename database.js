import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { Log } from './log.js';
import { Common } from './common.js';
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
                query: `${criteria.base} ${criteria.criteria} ${criteria.limit}`
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
                query: `${criteria.base} ${criteria.criteria} ${criteria.limit}`
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

            let mustCreate = await Prompt.askConfirmation(`[ ${sourceType.key} : ${sourceType.name} ] source type was not found in the database. must be created, otherwise fetched anime data will be lost. proceed ?`);
            
            if (mustCreate) {
                let newSourceType = await this.exec({
                    query: `INSERT INTO SourceType (Id, Key, Name, CreatedOn) VALUES (NULL, ?, ?, ?)`,
                    params: [
                        sourceType.key,
                        sourceType.name,
                        Common.getMomentNowFormat()
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
                query: `INSERT INTO Source (Id, KeyId, ExternalId, SourceTypeId, CreatedOn) VALUES (NULL, ?, ?, ?, ?)`,
                params: [
                    `${currentSourceType.Key}-${externalId}`,
                    externalId,
                    currentSourceType.Id,
                    Common.getMomentNowFormat()
                ]
            });

        } catch (error) {
            Log.error(`database : error creating source : [ ${externalId}, ${sourceType.key}, ${sourceType.name} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }
    }

    async createTheme(theme, keyId) {
        try {
            await this.exec({
                query: `INSERT INTO Theme (Id, KeyId, Theme, Artist, Title, Type, Sequence, Algorithm, CreatedOn) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params: [
                    `${keyId}`,
                    theme.theme,
                    theme.artist,
                    theme.title,
                    theme.type,
                    theme.sequence,
                    theme.algorithm,
                    Common.getMomentNowFormat()
                ]
            });

        } catch (error) {
            Log.error(`database : error creating theme : [ ${keyId}, ${theme.title}, ${theme.artist} ]`);
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
                        query: `UPDATE AniList SET Title = ?, Type = ?, Format = ?, Season = ?, SeasonYear = ?, Genres = ?, NumberOfEpisodes = ?, StartDate = ?, StartWeekNumber = ?, StartDayOfWeek = ?, HasPrequel = ?, HasSequel = ?, Status = ?, SiteUrl = ?, LastModifiedOn = ? WHERE Id = ?`, 
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
                            Common.getMomentNowFormat(),
                            currentAnime.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO AniList (Id, Title, Type, Format, Season, SeasonYear, Genres, NumberOfEpisodes, StartDate, StartWeekNumber, StartDayOfWeek, HasPrequel, HasSequel, Status, SiteUrl, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                            currentAnime.siteUrl,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
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

                let mustCreate = await Prompt.askConfirmation(`[ ${animes[0].userName} ] user was not found in the database. must be created, otherwise fetched personal data will be lost. proceed ?`);
                
                if (mustCreate) {
                    let newUser = await this.exec({
                        query: `INSERT INTO User (Id, Name, CreatedOn) VALUES (NULL, ?, ?)`,
                        params: [
                            animes[0].userName,
                            Common.getMomentNowFormat()
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
                        query: `INSERT INTO Personal (UserId, AniListId, Status, CreatedOn) VALUES (?, ?, ?, ?)`,
                        params: [
                            user.Id,
                            currentAnime.id,
                            currentAnime.personalStatus,
                            Common.getMomentNowFormat()
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
                        query: `UPDATE MyAnimeList SET Title = ?, Type = ?, Season = ?, SeasonYear = ?, NumberOfEpisodes = ?, StartDate = ?, EndDate = ?, Status = ?, LastModifiedOn = ? WHERE Id = ?`, 
                        params: [
                            currentAnime.title,
                            currentAnime.type,
                            currentAnime.season,
                            currentAnime.seasonYear,
                            currentAnime.numberOfEpisodes,
                            currentAnime.startDate,
                            currentAnime.endDate,
                            currentAnime.status,
                            Common.getMomentNowFormat(),
                            currentAnime.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO MyAnimeList (Id, Title, Type, Season, SeasonYear, NumberOfEpisodes, StartDate, EndDate, Status, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        params: [
                            currentAnime.id,
                            currentAnime.title,
                            currentAnime.type,
                            currentAnime.season,
                            currentAnime.seasonYear,
                            currentAnime.numberOfEpisodes,
                            currentAnime.startDate,
                            currentAnime.endDate,
                            currentAnime.status,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
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
                        query: `UPDATE AniList_MyAnimeList SET MyAnimeListId = ?, LastModifiedOn = ? WHERE AniListId = ?`, 
                        params: [
                            currentAnime.id,
                            Common.getMomentNowFormat(),
                            currentAnime.aniListId
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO AniList_MyAnimeList (AniListId, MyAnimeListId, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?)`,
                        params: [
                            currentAnime.aniListId,
                            currentAnime.id,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
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

    async saveThemes(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {
            
            const currentAnime = animes[animeIndex];
            let createThemes = true;

            try {

                let existingThemes = await this.select({
                    query: `SELECT S.KeyId, COUNT(T.Id) Count FROM Source S INNER JOIN SourceType ST ON S.SourceTypeId = ST.Id LEFT JOIN Theme T ON S.KeyId = T.KeyId WHERE ST.Name = ? AND S.ExternalId = ?`, 
                    params: [ 
                        'MyAnimeList',
                        currentAnime.id
                    ]
                });

                if (existingThemes === undefined) {
                    throw new Error(`Source for [ ${currentAnime.id} ${currentAnime.title} ] not found.`);
                }
    
                if (existingThemes.Count > 0) {
    
                    let mustDelete = await Prompt.askConfirmation(`[ ${existingThemes.Count} ] themes were found for the anime [ ${existingThemes.KeyId} : ${currentAnime.title} ]. themes and link data related to this anime must be deleted. proceed ?`);
                    
                    if (mustDelete) {
                        
                        let linkCleanupResult = await this.exec({
                            query: `DELETE FROM Link WHERE ThemeId IN (SELECT Id FROM Theme WHERE KeyId = ?)`,
                            params: [
                                existingThemes.KeyId
                            ]
                        });
                        execResults.deleted += linkCleanupResult.changes;

                        let themeCleanupResult = await this.exec({
                            query: `DELETE FROM Theme WHERE KeyId = ?`,
                            params: [
                                existingThemes.KeyId
                            ]
                        });
                        execResults.deleted += themeCleanupResult.changes;
                    } else {
                        createThemes = false;
                    }
                }

                if (createThemes) {
                    for (let openingIndex = 0; openingIndex < currentAnime.openings.length; openingIndex++) {
                        await this.createTheme(currentAnime.openings[openingIndex], existingThemes.KeyId);
                        execResults.added++;
                    }

                    for (let endingIndex = 0; endingIndex < currentAnime.endings.length; endingIndex++) {
                        await this.createTheme(currentAnime.endings[endingIndex], existingThemes.KeyId);
                        execResults.added++;
                    }
                }
            } catch (error) {
                Log.error(`database : error updating themes : [ ${currentAnime.id}, ${currentAnime.title} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : themes updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }
}

export { Database };