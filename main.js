import yargs from 'yargs';

import { Program } from './program.js';
import { Log } from './log.js';

let argv = (yargs)(process.argv.slice(2))
    .usage('usage: main.js <command> [options]')
    .command({
        command: 'seasons [options]',
        desc: 'imports anime information based on a season list',
        builder: (yargs) => { yargs
            .options({
                'database' : { type : 'string' },
                'source' : { type : 'string' },
                'config' : { type : 'string' },
                'archive' : { type : 'boolean', default: false }
            })
            .demandOption([ 'database', 'source', 'config', 'archive' ], "example: node main.js seasons --database='database/example.sqlite3' --source='anilist' --config='config/seasons.json'")
        },
        handler: async (argv) =>  {
            await (new Program(argv.database).runSeasons(argv.source, argv.config, argv.archive));
            Log.info('main : seasons command completed...');
        }
    })
    .command({
        command: 'personal [options]',
        desc: 'imports anime information based on a personal list',
        builder: (yargs) => { yargs
            .options({
                'database' : { type : 'string' },
                'source' : { type : 'string' },
                'config' : { type : 'string' },
                'archive' : { type : 'boolean', default: false }
            })
            .demandOption([ 'database', 'source', 'config', 'archive' ], "example: node main.js personal --database='database/example.sqlite3' --source='anilist' --config='config/personal.json'")
        },
        handler: async (argv) => {
            await (new Program(argv.database).runPersonal(argv.source, argv.config, argv.archive));
            Log.info('main : personal command completed...');
        }
    })
    .demandCommand()
    .help()
    .wrap(100)
    .argv;