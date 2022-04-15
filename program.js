import { Log } from './log.js';
import { Database } from './database.js';

import { AniList } from './facade/anilist.js';
import { MyAnimeList } from './facade/myanimelist.js';
import { YouTube } from './facade/youtube.js';

class Program {

    constructor(databasePath) {
        this.database = new Database(databasePath);
    }

    buildFacade(source) {
        switch (source.toLowerCase()) {
            case 'anilist':
                return new AniList(this.database);

            case 'myanimelist':
                return new MyAnimeList(this.database);
            
            case 'youtube':
                return new YouTube(this.database);
                
            default:
                throw new Error(`source '${source}' is not implemented.`);
        }
    }

    async runSeasons(source, config, fromArchive = false) {
        try {
            Log.info(`program : seasons command : [ ${source}, ${config} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);

            let animes = await facade.getAnimeBySeasons(config, fromArchive);
            
            if (animes && animes.length > 0) {
                await facade.saveAnime(animes);
            } else {
                Log.warn(`program : seasons command : no data to save : [ ${source}, ${config} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }
    
    async runPersonal(source, config, fromArchive = false) {
        try {
            Log.info(`program : personal command : [ ${source}, ${config} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);

            let animes = await facade.getAnimeByPersonalList(config, fromArchive);
            
            if (animes && animes.length > 0) {
                await facade.savePersonal(animes);
            } else {
                Log.warn(`program : personal command : no data to save : [ ${source}, ${config} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }
    
    async runScout(source, config, fromArchive = false) {
        try {
            Log.info(`program : scout command : [ ${source}, ${config} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);

            let animes = await facade.getAnimeByScout(config, fromArchive);
            
            if (animes && animes.length > 0) {
                await facade.saveScout(animes);
            } else {
                Log.warn(`program : scout command : no data to save : [ ${source}, ${config} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }

    async runThemes(source, config, fromArchive = false) {
        try {
            Log.info(`program : themes command : [ ${source}, ${config} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);

            let animes = await facade.getAnimeThemes(config, fromArchive);
            
            if (animes && animes.length > 0) {
                await facade.saveThemes(animes);
            } else {
                Log.warn(`program : themes command : no data to save : [ ${source}, ${config} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }

    async runMedias(source, config, fromArchive = false) {
        try {
            Log.info(`program : medias command : [ ${source}, ${config} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);

            let medias = await facade.getMedias(config, fromArchive);
            
            if (medias && medias.length > 0) {
                await facade.saveMedias(medias);
            } else {
                Log.warn(`program : medias command : no data to save : [ ${source}, ${config} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }
}

export { Program };