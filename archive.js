import fs from 'fs';
import path from 'path';

import { Log } from './log.js';
import { Config } from './config.js';
import { Common } from './common.js';

class Archive {

    static save(data, category) {
        if (Config.archiveEnable) {
            if (Config.archiveUnique) {
                let datepart = Common.getMomentNow().format('YYYYMMDD_HHmmss');
                category = `${category}_${datepart}`;
            }
            let archivePath = path.resolve(`archive/${category}.json`);
            fs.writeFileSync(archivePath, JSON.stringify(data, null, 4));
            Log.info(`archive : file saved : [ ${archivePath} ]`);
        }
    }

    static load(archivePath) {
        Log.warn(`archive : using archive file : [ ${archivePath} ]`);
        return JSON.parse(fs.readFileSync(path.resolve(archivePath)));
    }
}

export { Archive };