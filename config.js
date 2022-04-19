import fs from 'fs';
import path from 'path';

class Config {

    CONFIG_PATH = './global.config';

    constructor() {
        this.config = Config.parse(this.CONFIG_PATH);
    }

    static get instance() {
        if (!Config._instance) {
            Config._instance = new Config();
        }
        return Config._instance;
    }

    static get archiveEnable() {
        return Config.instance.config.archive.enable;
    }

    static get archiveUnique() {
        return Config.instance.config.archive.unique;
    }
    
    static get databasePath() {
        return Config.instance.config.database.path;
    }

    static get commandSeasons() {
        return Config.instance.config.command.seasons;
    }

    static get commandPersonal() {
        return Config.instance.config.command.personal;
    }

    static get commandScout() {
        return Config.instance.config.command.scout;
    }
    
    static get commandThemes() {
        return Config.instance.config.command.themes;
    }
    
    static get commandMedias() {
        return Config.instance.config.command.medias;
    }
    
    static get myAnimeListAuth() {
        return Config.instance.config.myanimelist.auth;
    }
    
    static get youtubeAuth() {
        return Config.instance.config.youtube.auth;
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