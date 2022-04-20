import fs from 'fs';
import path from 'path';

class Config {

    constructor() {}

    static get instance() {
        if (!Config._instance) {
            Config._instance = new Config();
        }
        return Config._instance;
    }

    static init(environment) {
        Config.instance.config = Config.parse(`./animedb.${environment}.json`);
    }

    static get config() {
        return Config.instance.config;
    }

    static get archiveEnable() {
        return Config.config.archive.enable;
    }

    static get archiveUnique() {
        return Config.config.archive.unique;
    }
    
    static get databasePath() {
        return Config.config.database.path;
    }

    static get commandSeasons() {
        return Config.config.command.seasons;
    }

    static get commandPersonal() {
        return Config.config.command.personal;
    }

    static get commandScout() {
        return Config.config.command.scout;
    }
    
    static get commandThemes() {
        return Config.config.command.themes;
    }
    
    static get commandMedias() {
        return Config.config.command.medias;
    }
    
    static get myAnimeListAuth() {
        return Config.config.myanimelist.auth;
    }
    
    static get youtubeAuth() {
        return Config.config.youtube.auth;
    }

    static parse(config) {
        return JSON.parse(fs.readFileSync(path.resolve(config)));
    }

    static parsedSeasons() {
        return Config.parse(Config.commandSeasons);
    }

    static parsedPersonal() {
        return Config.parse(Config.commandPersonal);
    }

    static parsedScout() {
        return Config.parse(Config.commandScout);
    }

    static parsedThemes() {
        return Config.parse(Config.commandThemes);
    }

    static parsedMedias() {
        return Config.parse(Config.commandMedias);
    }

    static parsedMyAnimeListAuth() {
        return Config.parse(Config.myAnimeListAuth);
    }
}

export { Config };