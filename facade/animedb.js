import { Log } from '../log.js';
import { Archive } from '../archive.js';

import { AniList } from './anilist.js';
import { MyAnimeList } from './myanimelist.js';
import { YouTube } from './youtube.js';

class AnimeDB {

    constructor(database) {
        this.database = database;
        this.aniListFacade = new AniList(this.database);
        this.myAnimeListFacade = new MyAnimeList(this.database);
    }

    async getAnimeBySeasons(criteria) {
        Log.warn('anilist : seasons command is not supported : see --help for more information');
    }

    async getAnimeByPickList(criteria) {
        let aniListAnimes = await this.aniListFacade.getAnimeByPickList(criteria);
        let myAnimeListAnimes = await this.myAnimeListFacade.getAnimeByPickList(criteria);
        let animes = this.mergeAnimeList(criteria, aniListAnimes, myAnimeListAnimes);
        Archive.save(animes, 'animedb_pick');
        return animes
    }

    async getAnimeByPersonalList(criteria) {
        Log.warn('anilist : personal command is not supported : see --help for more information');
    }

    async getAnimeByScout(config) {
        Log.warn('anilist : scout command is not supported : see --help for more information');
    }

    async getAnimeThemes(config) {
        Log.warn('anilist : themes command is not supported : see --help for more information');
    }
    
    async getMedias(config) {
        Log.warn('anilist : medias command is not supported : see --help for more information');
    }

    async saveAnime(animes) {
        Log.warn('youtube : seasons command is not supported : see --help for more information');
    }

    async savePick(animes) {
        Log.info(`anilist : saving personal anime : [ ${animes.length} entries ]`);
        await this.aniListFacade.savePick(animes);
        await this.myAnimeListFacade.savePick(animes);
    }
    
    async savePersonal(animes) {
        Log.warn('youtube : personal command is not supported : see --help for more information');
    }

    async saveScout(animes) {
        Log.warn('anilist : scout command is not supported : see --help for more information');
    }
    
    async saveThemes(animes) {
        Log.warn('anilist : themes command is not supported : see --help for more information');
    }

    async saveMedias(medias) {
        Log.warn('anilist : medias command is not supported : see --help for more information');
    }

    mergeAnimeList(criteria, aniListAnimes, myAnimeListAnimes) {
        let animeList = [];
        for (let identifierIndex = 0; identifierIndex < criteria.list.length; identifierIndex++) {
            const currentIdentifier = criteria.list[identifierIndex];
            const currentAniListId = parseInt(currentIdentifier.aniListId);
            const currentMyAnimeListId = parseInt(currentIdentifier.myAnimeListId);
            let item = {
                anilist: aniListAnimes.find(element => { 
                    return (element.anilist.id === currentAniListId && element.myanimelist.id === currentMyAnimeListId)
                }).anilist,
                myanimelist: myAnimeListAnimes.find(element => { 
                    return (element.myanimelist.id === currentMyAnimeListId && element.anilist.id === currentAniListId)
                }).myanimelist
            };
            animeList.push(item);
        }
        return animeList;
    }
}

export { AnimeDB };