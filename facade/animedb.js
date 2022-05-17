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
        this.youtubeFacade = new YouTube(this.database);
    }

    async getAnimeBySeasons(criteria) {
        Log.warn('animedb : seasons command is not supported : see --help for more information');
    }

    async getAnimeByPersonalList(criteria) {
        Log.warn('animedb : personal command is not supported : see --help for more information');
    }

    async getAnimeByScout(config) {
        Log.warn('animedb : scout command is not supported : see --help for more information');
    }

    async getAnimeThemes(config) {
        Log.warn('animedb : themes command is not supported : see --help for more information');
    }
    
    async getMedias(config) {
        Log.warn('animedb : medias command is not supported : see --help for more information');
    }

    async getAnimeByPickList(criteria) {
        let aniListAnimes = await this.aniListFacade.getAnimeByPickList(criteria);
        let myAnimeListAnimes = await this.myAnimeListFacade.getAnimeByPickList(criteria);
        let animes = this.mergeAnimeList(criteria, aniListAnimes, myAnimeListAnimes);
        Archive.save(animes, 'animedb_animepick');
        return animes
    }
    
    async getMediaByPickList(criteria) {
        let medias = await this.youtubeFacade.getMediaByPickList(criteria);
        Archive.save(medias, 'animedb_mediapick');
        return medias
    }

    async saveAnime(animes) {
        Log.warn('animedb : seasons command is not supported : see --help for more information');
    }
    
    async savePersonal(animes) {
        Log.warn('animedb : personal command is not supported : see --help for more information');
    }

    async saveScout(animes) {
        Log.warn('animedb : scout command is not supported : see --help for more information');
    }
    
    async saveThemes(animes) {
        Log.warn('animedb : themes command is not supported : see --help for more information');
    }

    async saveMedias(medias) {
        Log.warn('animedb : medias command is not supported : see --help for more information');
    }

    async saveAnimePick(animes) {
        Log.info(`animedb : saving anime pick : [ ${animes.length} entries ]`);
        await this.aniListFacade.saveAnimePick(animes);
        await this.myAnimeListFacade.saveAnimePick(animes);
    }
    
    async saveMediaPick(medias) {
        Log.info(`animedb : saving media pick : [ ${medias.length} entries ]`);
        await this.youtubeFacade.saveMediaPick(medias);
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