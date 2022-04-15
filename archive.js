import fs from 'fs';
import path from 'path';

import { Log } from './log.js';
import { Common } from './common.js';

class Archive {

    static save(data, category, unique = true) {
        if (unique) {
            let datepart = Common.getMomentNow().format('YYYYMMDD_HHmmss');
            category = `${category}_${datepart}`;
        }
        let archivePath = path.resolve(`archive/${category}.json`);
        fs.writeFileSync(archivePath, JSON.stringify(data, null, 4));
        Log.info(`archive : file saved : [ ${archivePath} ]`);
    }
}

export { Archive };