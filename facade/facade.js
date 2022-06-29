import { Log } from '../log.js';

class Facade {

    constructor(database) {
        this.database = database;
    }

    async getAnimeBySeasons(criteria) {
        Log.warn('facade : seasons command is not supported : see --help for more information');
    }

    async getAnimeByPersonalList(criteria) {
        Log.warn('facade : personal command is not supported : see --help for more information');
    }
    
    async getAnimeByScout(criteria) {
        Log.warn('facade : scout command is not supported : see --help for more information');
    }

    async getAnimeThemes(criteria) {
        Log.warn('facade : themes command is not supported : see --help for more information');
    }

    async getMedias(criteria) {
        Log.warn('facade : medias command is not supported : see --help for more information');
    }

    async getBatch(criteria) {
        Log.warn('facade : download command is not supported : see --help for more information');
    }

    async getAnimeByPickList(criteria) {
        Log.warn('facade : animepick command is not supported : see --help for more information');
    }
    
    async getMediaByPickList(criteria) {
        Log.warn('facade : mediapick command is not supported : see --help for more information');
    }

    async saveAnime(animes) {
        Log.warn('facade : seasons command is not supported : see --help for more information');
    }

    async savePersonal(animes) {
        Log.warn('facade : personal command is not supported : see --help for more information');
    }

    async saveScout(animes) {
        Log.warn('facade : scout command is not supported : see --help for more information');
    }

    async saveThemes(animes) {
        Log.warn('facade : themes command is not supported : see --help for more information');
    }

    async saveMedias(medias) {
        Log.warn('facade : medias command is not supported : see --help for more information');
    }

    async saveBatch(medias) {
        Log.warn('facade : medias command is not supported : see --help for more information');
    }

    async saveAnimePick(animes) {
        Log.warn('facade : animepick command is not supported : see --help for more information');
    }
    
    async saveMediaPick(medias) {
        Log.warn('facade : mediapick command is not supported : see --help for more information');
    }

    async processDownload(criteria) {
        Log.warn('facade : download command is not supported : see --help for more information');
    }
    
    async processTags(criteria) {
        Log.warn('facade : tags command is not supported : see --help for more information');
    }
}

export { Facade };