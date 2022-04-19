import { Log } from './log.js';
import { Config } from './config.js';
import { Archive } from './archive.js';
import { Database } from './database.js';

import { AniList } from './facade/anilist.js';
import { MyAnimeList } from './facade/myanimelist.js';
import { YouTube } from './facade/youtube.js';

class Program {

    constructor() {
        this.database = new Database();
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

    async runSeasons(source, fromArchive = false, archivePath) {
        try {
            Log.info(`program : seasons command : [ ${source}, ${Config.commandSeasons} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);
            let animes = [];

            if (fromArchive) {
                animes = Archive.load(archivePath)
            } else {
                animes = await facade.getAnimeBySeasons(Config.parsedSeasons(), fromArchive);
            }
            
            if (animes && animes.length > 0) {
                await facade.saveAnime(animes);
            } else {
                Log.warn(`program : seasons command : no data to save : [ ${source}, ${Config.commandSeasons} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }
    
    async runPersonal(source, fromArchive = false, archivePath) {
        try {
            Log.info(`program : personal command : [ ${source}, ${Config.commandPersonal} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);
            let animes = [];

            if (fromArchive) {
                animes = Archive.load(archivePath)
            } else {
                animes = await facade.getAnimeByPersonalList(Config.parsedPersonal());
            }
            
            if (animes && animes.length > 0) {
                await facade.savePersonal(animes);
            } else {
                Log.warn(`program : personal command : no data to save : [ ${source}, ${Config.commandPersonal} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }
    
    async runScout(source, fromArchive = false, archivePath) {
        try {
            Log.info(`program : scout command : [ ${source}, ${Config.commandScout} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);
            let animes = [];

            if (fromArchive) {
                animes = Archive.load(archivePath)
            } else {
                animes = await facade.getAnimeByScout(Config.parsedScout());
            }

            if (animes && animes.length > 0) {
                await facade.saveScout(animes);
            } else {
                Log.warn(`program : scout command : no data to save : [ ${source}, ${Config.commandScout} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }

    async runThemes(source, fromArchive = false, archivePath) {
        try {
            Log.info(`program : themes command : [ ${source}, ${Config.commandThemes} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);
            let animes = [];

            if (fromArchive) {
                animes = Archive.load(archivePath)
            } else {
                animes = await facade.getAnimeThemes(Config.parsedThemes());
            }
            
            if (animes && animes.length > 0) {
                await facade.saveThemes(animes);
            } else {
                Log.warn(`program : themes command : no data to save : [ ${source}, ${Config.commandThemes} ]`);
            }
            
        } catch (error) {
            if (error.isAxiosError) {
                Log.fatal(error.response.data.errors);
            }
            Log.fatal(error.message);
            Log.fatal(error.stack);
        }
    }

    async runMedias(source, fromArchive = false, archivePath) {
        try {
            Log.info(`program : medias command : [ ${source}, ${Config.commandMedias} ]`);

            await this.database.init();

            let facade = this.buildFacade(source);
            let medias = [];

            if (fromArchive) {
                medias = Archive.load(archivePath)
            } else {
                medias = await facade.getMedias(Config.parsedMedias());
            }
            
            if (medias && medias.length > 0) {
                await facade.saveMedias(medias);
            } else {
                Log.warn(`program : medias command : no data to save : [ ${source}, ${Config.commandMedias} ]`);
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