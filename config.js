import fs from 'fs';

class Config {

    static parse(path) {
        return JSON.parse(fs.readFileSync(path));
    }
}

export { Config };