import moment from 'moment';

import { Log } from './log.js';
import { Config } from './config.js';

class Common {

    static sleep(miliseconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, miliseconds);
        });
    }

    static getMediaSesonValue(season) {
        return season.toUpperCase();
    }

    static getMomentNow() {
        return moment(new Date());
    }

    static getMomentNowFormat() {
        return Common.getMomentNow().format();
    }

    static getMoment(input) {
        return moment(input, 'YYYY-MM-DD');
    }

    static subtractMoments(moment1, moment2, unitOfTime) {
        return moment1.diff(moment2, unitOfTime)
    }

    static convertISO8601ToSeconds(input) {
        return moment.duration(input, moment.ISO_8601).asSeconds();
    }
    
    static hasPrequel(relations) {
        return relations.some(r => r.relationType == "PREQUEL");
    }
    
    static hasSequel(relations) {
        return relations.some(r => r.relationType == "SEQUEL");
    }

    static parseAnimeThemes(themes, type) {
        
        let parsedThemes = [];
        
        if (themes) {

            const regexDefault = new RegExp(Config.myAnimeListRegexThemeParseDefault);
            const regexNoMatch = new RegExp(Config.myAnimeListRegexThemeParseNoMatch);
            
            for (let index = 0; index < themes.length; index++) {

                const current = themes[index];
                const currentTheme = current.text.trim();

                // default algorithm
                const matchDefault = regexDefault.exec(currentTheme);
                if (matchDefault) {
                    parsedThemes.push(Common.parseThemeDefault(matchDefault, type, currentTheme));
                } else {
                    // nomatch algorithm
                    const matchNoMatch = regexNoMatch.exec(currentTheme);
                    if (matchNoMatch) {
                        parsedThemes.push(Common.parseThemeNoMatch(matchNoMatch, type, currentTheme));
                    } else {
                        parsedThemes.push(Common.unparsedTheme(type, currentTheme));
                    }
                }

                Log.trace(`common : parsed anime theme : [ ${currentTheme} ]`);
            }
        }
        return parsedThemes;
    }

    static parseThemeDefault(match, type, theme) {
        return {
            theme : theme,
            title : Common.parseThemeTitle(match[9]),
            artist : Common.parseThemeArtist(match[18], match[22]),
            type : type,
            sequence : Common.parseThemeSequence(match[4]),
            algorithm : 'DEFAULT'
        };
    }
    
    static parseThemeNoMatch(match, type, theme) {
        return {
            theme : theme,
            title : Common.parseThemeTitle(match[9]),
            artist : Common.parseThemeArtist(match[15]),
            type : type,
            sequence : Common.parseThemeSequence(match[4]),
            algorithm : 'NO_MATCH'
        };
    }

    static unparsedTheme(type, theme) {
        return {
            theme : theme,
            title : '',
            artist : '',
            type : type,
            sequence : 0,
            algorithm : 'ERROR'
        };
    }

    static parseThemeSequence(sequence) {
        if (sequence === undefined || sequence === '') {
            return 1;
        }
        return parseInt(sequence);
    }

    static parseThemeTitle(title) {
        return title.trim();
    }

    static parseThemeArtist(artist, alternative = '') {
        if (artist === undefined || artist === '') {
            return alternative.trim();
        }
        return artist.trim();
    }

    static parseThemeType(themeType) {
        switch (themeType) {
            case 'OPENING':
                return 'OP';
            case 'ENDING':
                return 'ED';
            default:
                return 'THEME';
        }
    }

    static parseDownloadAlbum(media) {
        return `${media.AniListTitle} - ${Common.parseThemeType(media.ThemeType)} ${media.ThemeSequence}`;
    }
    
    static parseDownloadFileName(download) {
        const fileName = `'${String(download.download.id).padStart(4, '0')}'_'${download.download.artist}'_'${download.download.title}'_'${download.download.album}'`;
        return fileName.replace(/[^a-z0-9\s\!\#\$\%\&\'\(\)\+\,\-\.\=\@\[\]\^\_\`\{\}\~]+/gi, ' ');
    }
}

export { Common }