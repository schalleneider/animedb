class Common {

    static getMediaSesonValue(season) {
        return season.toUpperCase();
    }

    static getDate(year, month, day) {
        return new Date(year, (month - 1), day);
    }
    
    static getDayOfWeek(date) {
        return (date.getDay() + 6) % 7;
    }
    
    static getDayOfWeekLiteral(dayOfWeek) {
        switch (dayOfWeek) {
            case 0: return "Monday";
            case 1: return "Tuesday";
            case 2: return "Wednesday";
            case 3: return "Thursday";
            case 4: return "Friday";
            case 5: return "Saturday";
            case 6: return "Sunday";
        }
    }
    
    static getWeekNumber(date) {
        date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }
    
    static hasPrequel(relations) {
        return relations.some(r => r.relationType == "PREQUEL");
    }
    
    static hasSequel(relations) {
        return relations.some(r => r.relationType == "SEQUEL");
    }

    static parseAnimeThemes(themes, type) {
        if (themes === undefined) {
            return [];
        }
        const regex = /^((#*([0-9]*):*)(.+))( by )([^(\n]+)(\([\S ]+\).?)*$/;
        let songs = [];
        for (let index = 0; index < themes.length; index++) {
            const current = themes[index];
            const match = regex.exec(current.text.trim());
            if (match) {
                const song = {
                    title : Common.parseThemeTitle(match[4].trim()),
                    artist : Common.parseThemeArtist(match[6].trim()),
                    type : type,
                    sequence : Common.parseThemeSequence(match[3]),
                };
                songs.push(song);
            } else {
                const song = {
                    title : current.text.trim(),
                    artist : '',
                    type : type,
                    sequence : -1,
                };
                songs.push(song);
            }
        }
        return songs;
    }

    static parseThemeSequence(sequence) {
        if (sequence === '') {
            return 1;
        }
        return parseInt(sequence);
    }

    static parseThemeTitle(title) {
        if (title[0] === '\"') {
            title = title.substr(1, title.length - 1);
        }
        if (title[title.length - 1] === '\"') {
            title = title.substr(0, title.length -1);
        }
        return title;
    }

    static parseThemeArtist(artist) {
        return artist;
    }

}

export { Common }