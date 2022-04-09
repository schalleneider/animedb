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

}

export { Common }