import fs from 'fs';
import path from 'path';
import moment from 'moment';

import { Log } from './log.js';

class Archive {

    static save(data, category, unique = true) {
        
        if (unique) {
            let datepart = moment(new Date()).format('YYYYMMDD_HHmmss');
            category = `${category}_${datepart}`;
        }
        let archivePath = path.resolve(`archive/${category}.json`);
        fs.writeFileSync(archivePath, JSON.stringify(data, null, 4));
        Log.info(`archive : file saved : [ ${archivePath} ]`);
    }
}

export { Archive };