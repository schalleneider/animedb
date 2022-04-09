import { Log } from './log.js';
import { Database } from './database.js';

import { Anilist } from './facade/anilist.js';

class Program {

    constructor(databasePath) {
        this.database = new Database(databasePath);
    }

    buildFacade(source) {
        switch (source.toLowerCase()) {
            case 'anilist':
                return new Anilist(this.database);

            case 'myanimelist':
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
}

export { Program };