import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { Log } from './log.js';
import { Config } from './config.js';
import { Common } from './common.js';
import { Prompt } from './prompt.js';

class Database {

    async init() {
        this.database = await open({
            filename: Config.databasePath,
            driver: sqlite3.Database
        });
        Log.info(`database : connection opened : [ ${Config.databasePath} ]`);
    }

    async begin() {
        await this.database.run("begin transaction");
    }

    async commit() {
        await this.database.run("commit");
    }

    async rollback() {
        await this.database.run("rollback");
    }

    async select(config) {
        return await this.database.get(config.query, config.params)
    }

    async selectAll(config) {
        return await this.database.all(config.query, config.params)
    }

    async exec(config) {
        return await this.database.run(config.query, config.params)
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
            Log.error(`database : error retrieving anilist : [ ${criteria} ]`);
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
            Log.error(`database : error retrieving myanimelist : [ ${criteria} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }

        return [];
    }

    async getThemes(criteria) {
        try {

            const result = await this.selectAll({
                query: `${criteria.base} ${criteria.criteria} ${criteria.limit}`
            });

            if (result.length > 0) {
                return result;
            }

        } catch (error) {
            Log.error(`database : error retrieving themes : [ ${criteria} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }

        return [];
    }

    async getMedias(criteria) {
        try {

            const result = await this.selectAll({
                query: `${criteria.base} ${criteria.criteria} ${criteria.limit}`
            });

            if (result.length > 0) {
                return result;
            }

        } catch (error) {
            Log.error(`database : error retrieving medias : [ ${criteria} ]`);
            Log.error(error.message);
            Log.error(error.stack);
        }

        return [];
    }

    async getDownloads(criteria) {
        try {

            const result = await this.selectAll({
                query: `${criteria.base} ${criteria.criteria} ${criteria.limit}`
            });

            if (result.length > 0) {
                return result;
            }

        } catch (error) {
            Log.error(`database : error retrieving medias : [ ${criteria} ]`);
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
                    Id: newSourceType.lastID,
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

    async reviewTheme(theme, currentAnimeMyAnimeList) {

        Log.warn(`theme review for: [ ${theme.title} ${theme.artist} - ${theme.type} ${theme.sequence} ]`);

        let existingTheme = await this.select({
            query: `SELECT T.Id, T.Artist, T.Title, T.Type, T.Sequence FROM Theme T INNER JOIN Source S ON S.KeyId = T.KeyId INNER JOIN SourceType ST ON S.SourceTypeId = ST.Id WHERE ST.Name = ? AND S.ExternalId = ? AND T.Type = ? AND T.Sequence = ?`,
            params: [
                'MyAnimeList',
                currentAnimeMyAnimeList.id,
                theme.type,
                theme.sequence
            ]
        });

        if (existingTheme === undefined) {
            return await Prompt.askConfirmation(`existing theme for [ ${currentAnimeMyAnimeList.id} ${currentAnimeMyAnimeList.title} ${theme.type} ${theme.sequence} ] not found. proceeding will force the creation of a new entry in database. proceed ?`);
        }
        else {
            return await Prompt.askCautionConfirmation(`this theme is already in the database: [ ${existingTheme.Title} ${existingTheme.Artist} - ${existingTheme.Type} ${existingTheme.Sequence} ]. proceeding will force the creation of a new entry in database. proceed ?`);
        }
    }

    async saveAniList(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {

            const currentAnimeAniList = animes[animeIndex].anilist;

            try {

                const currentExists = await this.select({
                    query: `SELECT Id FROM AniList WHERE Id = ?`,
                    params: [currentAnimeAniList.id]
                });

                if (currentExists) {

                    await this.exec({
                        query: `UPDATE AniList SET Title = ?, Type = ?, Format = ?, Season = ?, SeasonYear = ?, Genres = ?, NumberOfEpisodes = ?, StartDate = ?, StartWeekNumber = ?, StartDayOfWeek = ?, HasPrequel = ?, HasSequel = ?, Status = ?, Address = ?, LastModifiedOn = ? WHERE Id = ?`,
                        params: [
                            currentAnimeAniList.title,
                            currentAnimeAniList.type,
                            currentAnimeAniList.format,
                            currentAnimeAniList.season,
                            currentAnimeAniList.seasonYear,
                            currentAnimeAniList.genres,
                            currentAnimeAniList.numberOfEpisodes,
                            currentAnimeAniList.startDate,
                            currentAnimeAniList.startWeekNumber,
                            currentAnimeAniList.startDayOfWeek,
                            currentAnimeAniList.hasPrequel,
                            currentAnimeAniList.hasSequel,
                            currentAnimeAniList.status,
                            currentAnimeAniList.address,
                            Common.getMomentNowFormat(),
                            currentAnimeAniList.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO AniList (Id, Title, Type, Format, Season, SeasonYear, Genres, NumberOfEpisodes, StartDate, StartWeekNumber, StartDayOfWeek, HasPrequel, HasSequel, Status, Address, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        params: [
                            currentAnimeAniList.id,
                            currentAnimeAniList.title,
                            currentAnimeAniList.type,
                            currentAnimeAniList.format,
                            currentAnimeAniList.season,
                            currentAnimeAniList.seasonYear,
                            currentAnimeAniList.genres,
                            currentAnimeAniList.numberOfEpisodes,
                            currentAnimeAniList.startDate,
                            currentAnimeAniList.startWeekNumber,
                            currentAnimeAniList.startDayOfWeek,
                            currentAnimeAniList.hasPrequel,
                            currentAnimeAniList.hasSequel,
                            currentAnimeAniList.status,
                            currentAnimeAniList.address,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
                        ]
                    });
                    await this.createSource(currentAnimeAniList.id, { key: "ANI", name: "AniList" });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating anilist : [ ${currentAnimeAniList.id}, ${currentAnimeAniList.title} ]`);
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
                params: [animes[0].personal.userName]
            });

            if (user === undefined) {

                let mustCreate = await Prompt.askConfirmation(`[ ${animes[0].personal.userName} ] user was not found in the database. must be created, otherwise fetched personal data will be lost. proceed ?`);

                if (mustCreate) {
                    let newUser = await this.exec({
                        query: `INSERT INTO User (Id, Name, CreatedOn) VALUES (NULL, ?, ?)`,
                        params: [
                            animes[0].personal.userName,
                            Common.getMomentNowFormat()
                        ]
                    });

                    user = {
                        Id: newUser.lastID
                    };
                }
                else {
                    Log.warn(`database : [ ${animes[0].personal.userName} ] user was not created and personal data was not commited to the database`);

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

                const currentAnimeAniList = animes[animeIndex].anilist;
                const currentAnimePersonal = animes[animeIndex].personal;

                try {
                    await this.exec({
                        query: `INSERT INTO Personal (UserId, AniListId, Status, CreatedOn) VALUES (?, ?, ?, ?)`,
                        params: [
                            user.Id,
                            currentAnimeAniList.id,
                            currentAnimePersonal.status,
                            Common.getMomentNowFormat()
                        ]
                    });
                    execResults.added++;
                } catch (error) {
                    Log.error(`database : error updating personal : [ ${currentAnimePersonal.userName}, ${currentAnimeAniList.id}, ${currentAnimeAniList.title} ]`);
                    Log.error(error.message);
                    Log.error(error.stack);
                    execResults.errors++;
                }
            }

            await this.commit();

            Log.info(`database : personal updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);

        } catch (error) {
            Log.error(`database : error updating personal : [ ${animes[0].personal.userName} ]`);
            Log.error(error.message);
            Log.error(error.stack);
            await this.rollback();
        }
    }

    async saveCustomList(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        try {

            let user = await this.select({
                query: `SELECT Id FROM User WHERE Name = ?`,
                params: [animes[0].personal.userName]
            });

            if (user === undefined) {

                let mustCreate = await Prompt.askConfirmation(`[ ${animes[0].personal.userName} ] user was not found in the database. must be created, otherwise fetched personal data will be lost. proceed ?`);

                if (mustCreate) {
                    let newUser = await this.exec({
                        query: `INSERT INTO User (Id, Name, CreatedOn) VALUES (NULL, ?, ?)`,
                        params: [
                            animes[0].personal.userName,
                            Common.getMomentNowFormat()
                        ]
                    });

                    user = {
                        Id: newUser.lastID
                    };
                }
                else {
                    Log.warn(`database : [ ${animes[0].personal.userName} ] user was not created and personal data was not commited to the database`);

                    await this.commit();
                    return;
                }
            }

            let cleanupPersonalListResult = await this.exec({
                query: `DELETE FROM PersonalList WHERE UserId = ?`,
                params: [
                    user.Id
                ]
            });
            execResults.deleted += cleanupPersonalListResult.changes;
            
            let cleanupCustomListResult = await this.exec({
                query: `DELETE FROM UserCustomList WHERE UserId = ?`,
                params: [
                    user.Id
                ]
            });
            execResults.deleted += cleanupCustomListResult.changes;

            let userCustomLists = [...animes[0].personal.userCustomLists];

            for (let indexUserCustomLists = 0; indexUserCustomLists < userCustomLists.length; indexUserCustomLists++) {

                let currentUserCustomList = userCustomLists[indexUserCustomLists];

                try {
                    await this.exec({
                        query: `INSERT INTO UserCustomList (Id, UserId, Name, CreatedOn) VALUES (NULL, ?, ?, ?)`,
                        params: [
                            user.Id,
                            currentUserCustomList,
                            Common.getMomentNowFormat()
                        ]
                    });
                    execResults.added++;
                } catch (error) {
                    Log.error(`database : error updating userCustomsList : [ ${animes[0].personal.userName}, ${currentUserCustomList} ]`);
                    Log.error(error.message);
                    Log.error(error.stack);
                    execResults.errors++;
                }

            }

            for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {

                const currentAnimeAniList = animes[animeIndex].anilist;
                const currentAnimePersonal = animes[animeIndex].personal;
                const currentAnimePersonalList = [...animes[animeIndex].personalList];

                for (let indexCurrentAnimePersonalList = 0; indexCurrentAnimePersonalList < currentAnimePersonalList.length; indexCurrentAnimePersonalList++) {

                    let currentAnimePersonalListItem = currentAnimePersonalList[indexCurrentAnimePersonalList];

                    try {
                        await this.exec({
                            query: `INSERT INTO PersonalList SELECT Id, ?, UserId, ? FROM UserCustomList WHERE Name = ? AND UserId = ?`,
                            params: [
                                currentAnimeAniList.id,
                                Common.getMomentNowFormat(),
                                currentAnimePersonalListItem.userCustomList,
                                user.Id
                                
                            ]
                        });
                        execResults.added++;
                    } catch (error) {
                        Log.error(`database : error updating personalList : [ ${currentAnimePersonal.userName}, ${currentAnimePersonalListItem.userCustomList}, ${currentAnimeAniList.id}, ${currentAnimeAniList.title} ]`);
                        Log.error(error.message);
                        Log.error(error.stack);
                        execResults.errors++;
                    }

                }
                
            }

            await this.commit();

            Log.info(`database : userCustomsList and personalList updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);

        } catch (error) {
            Log.error(`database : error updating userCustomsList and personalList : [ ${animes[0].personal.userName} ]`);
            Log.error(error.message);
            Log.error(error.stack);
            await this.rollback();
        }

    }

    async saveMyAnimeList(animes) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let animeIndex = 0; animeIndex < animes.length; animeIndex++) {

            const currentAnimeMyAnimeList = animes[animeIndex].myanimelist;

            try {

                const currentExists = await this.select({
                    query: `SELECT Id FROM MyAnimeList WHERE Id = ?`,
                    params: [currentAnimeMyAnimeList.id]
                });

                if (currentExists) {

                    await this.exec({
                        query: `UPDATE MyAnimeList SET Title = ?, Type = ?, Season = ?, SeasonYear = ?, NumberOfEpisodes = ?, StartDate = ?, EndDate = ?, Status = ?, LastModifiedOn = ? WHERE Id = ?`,
                        params: [
                            currentAnimeMyAnimeList.title,
                            currentAnimeMyAnimeList.type,
                            currentAnimeMyAnimeList.season,
                            currentAnimeMyAnimeList.seasonYear,
                            currentAnimeMyAnimeList.numberOfEpisodes,
                            currentAnimeMyAnimeList.startDate,
                            currentAnimeMyAnimeList.endDate,
                            currentAnimeMyAnimeList.status,
                            Common.getMomentNowFormat(),
                            currentAnimeMyAnimeList.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO MyAnimeList (Id, Title, Type, Season, SeasonYear, NumberOfEpisodes, StartDate, EndDate, Status, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        params: [
                            currentAnimeMyAnimeList.id,
                            currentAnimeMyAnimeList.title,
                            currentAnimeMyAnimeList.type,
                            currentAnimeMyAnimeList.season,
                            currentAnimeMyAnimeList.seasonYear,
                            currentAnimeMyAnimeList.numberOfEpisodes,
                            currentAnimeMyAnimeList.startDate,
                            currentAnimeMyAnimeList.endDate,
                            currentAnimeMyAnimeList.status,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
                        ]
                    });
                    await this.createSource(currentAnimeMyAnimeList.id, { key: "MAL", name: "MyAnimeList" });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating myanimelist : [ ${currentAnimeMyAnimeList.id}, ${currentAnimeMyAnimeList.title} ]`);
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

            const currentAnimeMyAnimeList = animes[animeIndex].myanimelist;
            const currentAnimeAniList = animes[animeIndex].anilist;

            try {

                const currentExists = await this.select({
                    query: `SELECT AniListId FROM AniList_MyAnimeList WHERE AniListId = ?`,
                    params: [currentAnimeAniList.id]
                });

                if (currentExists) {

                    await this.exec({
                        query: `UPDATE AniList_MyAnimeList SET MyAnimeListId = ?, LastModifiedOn = ? WHERE AniListId = ?`,
                        params: [
                            currentAnimeMyAnimeList.id,
                            Common.getMomentNowFormat(),
                            currentAnimeAniList.id
                        ]
                    });
                    execResults.updated++;
                } else {
                    await this.exec({
                        query: `INSERT INTO AniList_MyAnimeList (AniListId, MyAnimeListId, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?)`,
                        params: [
                            currentAnimeAniList.id,
                            currentAnimeMyAnimeList.id,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
                        ]
                    });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating scout : [ ${currentAnimeMyAnimeList.id}, ${currentAnimeMyAnimeList.title} ]`);
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

            const currentAnimeMyAnimeList = animes[animeIndex].myanimelist;
            const currentAnimeThemes = animes[animeIndex].themes;

            try {

                let existingThemes = await this.select({
                    query: `SELECT S.KeyId, COUNT(T.Id) Count FROM Source S INNER JOIN SourceType ST ON S.SourceTypeId = ST.Id LEFT JOIN Theme T ON S.KeyId = T.KeyId WHERE ST.Name = ? AND S.ExternalId = ?`,
                    params: [
                        'MyAnimeList',
                        currentAnimeMyAnimeList.id
                    ]
                });

                if (existingThemes === undefined) {
                    throw new Error(`source for [ ${currentAnimeMyAnimeList.id} ${currentAnimeMyAnimeList.title} ] not found.`);
                }

                if (existingThemes.Count > 0) {

                    let mustReview = await Prompt.askConfirmation(`[ ${existingThemes.Count} ] existing themes were found for the anime [ ${existingThemes.KeyId} : ${currentAnimeMyAnimeList.title} ]. themes related to this anime must be reviewed individually to avoid conflicts. proceed ?`);

                    // theme creation / update reviewd individually
                    if (mustReview) {
                        
                        for (let openingIndex = 0; openingIndex < currentAnimeThemes.openings.length; openingIndex++) {
                            
                            let mustForceCreate = await this.reviewTheme(currentAnimeThemes.openings[openingIndex], currentAnimeMyAnimeList);

                            if (mustForceCreate) {
                                await this.createTheme(currentAnimeThemes.openings[openingIndex], existingThemes.KeyId);
                                execResults.added++;
                            }
                        }
    
                        for (let endingIndex = 0; endingIndex < currentAnimeThemes.endings.length; endingIndex++) {

                            let mustForceCreate = await this.reviewTheme(currentAnimeThemes.endings[endingIndex], currentAnimeMyAnimeList);

                            if (mustForceCreate) {
                                await this.createTheme(currentAnimeThemes.endings[endingIndex], existingThemes.KeyId);
                                execResults.added++;
                            }
                        }
                    }
                }
                else { // default theme creation without conflict
 
                    for (let openingIndex = 0; openingIndex < currentAnimeThemes.openings.length; openingIndex++) {
                        await this.createTheme(currentAnimeThemes.openings[openingIndex], existingThemes.KeyId);
                        execResults.added++;
                    }

                    for (let endingIndex = 0; endingIndex < currentAnimeThemes.endings.length; endingIndex++) {
                        await this.createTheme(currentAnimeThemes.endings[endingIndex], existingThemes.KeyId);
                        execResults.added++;
                    }
                }
            } catch (error) {
                Log.error(`database : error updating themes : [ ${currentAnimeMyAnimeList.id}, ${currentAnimeMyAnimeList.title} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : themes updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }

    async saveMedias(medias) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let themeIndex = 0; themeIndex < medias.length; themeIndex++) {

            const currentMediaTheme = medias[themeIndex].theme;
            const currentMediaYoutubeList = medias[themeIndex].youtube;

            try {

                const currentThemeDownloadExists = await this.select({
                    query: `SELECT COUNT(Download.Id) DownloadThemeCount FROM Download INNER JOIN Media ON Download.KeyId = Media.Id WHERE Media.ThemeId = ?`,
                    params: [
                        currentMediaTheme.id
                    ]
                });

                if (currentThemeDownloadExists) {
                    if (currentThemeDownloadExists.DownloadThemeCount > 0) {
                        let mustDeleteDownload = await Prompt.askConfirmation(`[${currentThemeDownloadExists.DownloadThemeCount}] downloads were found for theme [${currentMediaTheme.id}]. delete previous data to proceed ?`);
                        if (!mustDeleteDownload) {
                            throw new Error(`downloads were found and delete was not accepted. no download changes will be done for theme [${currentMediaTheme.id}].`);
                        }
                    }
                }
                
                const currentThemeMediaExists = await this.select({
                    query: `SELECT ThemeId, SUM(CASE IsFinalChoice WHEN 1 THEN 1 ELSE 0 END) FinalChoiceCount, SUM(CASE IsFinalChoice WHEN 0 THEN 1 ELSE 0 END) PendingChoiceCount FROM Media WHERE ThemeId = ?`,
                    params: [
                        currentMediaTheme.id
                    ]
                });

                if (currentThemeMediaExists) {
                    if (currentThemeMediaExists.FinalChoiceCount > 0) {
                        let mustDeleteMedia = await Prompt.askConfirmation(`[${currentThemeMediaExists.FinalChoiceCount}] final choice medias were found for theme [${currentMediaTheme.id}]. delete previous data to proceed ?`);
                        if (!mustDeleteMedia) {
                            throw new Error(`final choice medias were found and delete was not accepted. no media changes will be done for theme [${currentMediaTheme.id}].`);
                        }
                    }
                }

                let cleanupDownloadResult = await this.exec({
                    query: `DELETE FROM Download WHERE KeyId IN (SELECT Id FROM Media WHERE ThemeId = ?)`,
                    params: [
                        currentMediaTheme.id
                    ]
                });
                execResults.deleted += cleanupDownloadResult.changes;
                
                let cleanupMediaResult = await this.exec({
                    query: `DELETE FROM Media WHERE ThemeId = ?`,
                    params: [
                        currentMediaTheme.id
                    ]
                });
                execResults.deleted += cleanupMediaResult.changes;

                for (let mediaIndex = 0; mediaIndex < currentMediaYoutubeList.length; mediaIndex++) {

                    const currentMediaYouTube = currentMediaYoutubeList[mediaIndex];

                    await this.exec({
                        query: `INSERT INTO Media (Id, ThemeId, KeyId, Title, Description, Channel, Duration, DurationSeconds, NumberOfViews, NumberOfLikes, SearchSequence, IsLicensed, IsBestRank, IsFinalChoice, Rank, SearchType, Address, CreatedOn, LastModifiedOn) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        params: [
                            currentMediaTheme.id,
                            currentMediaYouTube.keyId,
                            currentMediaYouTube.title,
                            currentMediaYouTube.description,
                            currentMediaYouTube.channel,
                            currentMediaYouTube.duration,
                            currentMediaYouTube.durationSeconds,
                            currentMediaYouTube.numberOfViews,
                            currentMediaYouTube.numberOfLikes,
                            currentMediaYouTube.searchSequence,
                            currentMediaYouTube.isLicensed,
                            currentMediaYouTube.isBestRank,
                            currentMediaYouTube.isFinalChoice,
                            currentMediaYouTube.rank,
                            currentMediaYouTube.searchType,
                            currentMediaYouTube.address,
                            Common.getMomentNowFormat(),
                            Common.getMomentNowFormat()
                        ]
                    });
                    execResults.added++;
                }
            } catch (error) {
                Log.error(`database : error updating medias : [ ${currentMediaTheme.id} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : medias updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }

    async saveBatch(batch) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {

            const currentDownloadMedia = batch[batchIndex].media;
            const currentDownload = batch[batchIndex].download;

            try {
                
                await this.exec({
                    query: `INSERT INTO Download (Id, KeyId, Address, Artist, Title, Album, FileName, Status, CreatedOn, LastModifiedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: [
                        currentDownload.id,
                        currentDownloadMedia.id,
                        currentDownload.address,
                        currentDownload.artist,
                        currentDownload.title,
                        currentDownload.album,
                        currentDownload.fileName,
                        currentDownload.status,
                        Common.getMomentNowFormat(),
                        Common.getMomentNowFormat()
                    ]
                });
                execResults.added++;
            } catch (error) {
                Log.error(`database : error updating download : [ ${currentDownloadMedia.id} ]`);
                Log.error(error.message);
                Log.error(error.stack);
                execResults.errors++;
            }
        }

        await this.commit();

        Log.info(`database : download updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }

    async saveDownload(downloadId, nextStatus) {

        let execResults = { added: 0, updated: 0, deleted: 0, errors: 0 };

        await this.begin();

        try {
            
            await this.exec({
                query: `UPDATE Download SET Status = ? WHERE Id = ?`,
                params: [
                    nextStatus,
                    downloadId
                ]
            });
            execResults.updated++;
            
        } catch (error) {
            Log.error(`database : error updating download : [ ${downloadId} ]`);
            Log.error(error.message);
            Log.error(error.stack);
            execResults.errors++;
        }

        await this.commit();

        Log.info(`database : download updated : [ added: ${execResults.added}, updated: ${execResults.updated}, deleted: ${execResults.deleted}, errors: ${execResults.errors} ]`);
    }
}

export { Database };