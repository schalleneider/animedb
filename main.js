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
            .demandOption([ 'database', 'source', 'config', 'archive' ], "example: node main.js seasons --database='database/template.sqlite3' --source='anilist' --config='config/seasons.json'")
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
            .demandOption([ 'database', 'source', 'config', 'archive' ], "example: node main.js personal --database='database/template.sqlite3' --source='anilist' --config='config/personal.json'")
        },
        handler: async (argv) => {
            await (new Program(argv.database).runPersonal(argv.source, argv.config, argv.archive));
            Log.info('main : personal command completed...');
        }
    })
    .command({
        command: 'scout [options]',
        desc: 'scout anime information on myanimelist based on anilist entries',
        builder: (yargs) => { yargs
            .options({
                'database' : { type : 'string' },
                'source' : { type : 'string' },
                'config' : { type : 'string' },
                'archive' : { type : 'boolean', default: false }
            })
            .demandOption([ 'database', 'source', 'config', 'archive' ], "example: node main.js scout --database='database/template.sqlite3' --source='myanimelist' --config='config/scout.json'")
        },
        handler: async (argv) => {
            await (new Program(argv.database).runScout(argv.source, argv.config, argv.archive));
            Log.info('main : scout command completed...');
        }
    })
    .command({
        command: 'themes [options]',
        desc: 'imports opening and ending themes from myanimelist',
        builder: (yargs) => { yargs
            .options({
                'database' : { type : 'string' },
                'source' : { type : 'string' },
                'config' : { type : 'string' },
                'archive' : { type : 'boolean', default: false }
            })
            .demandOption([ 'database', 'source', 'config', 'archive' ], "example: node main.js scout --database='database/template.sqlite3' --source='myanimelist' --config='config/themes.json'")
        },
        handler: async (argv) => {
            await (new Program(argv.database).runThemes(argv.source, argv.config, argv.archive));
            Log.info('main : themes command completed...');
        }
    })
    .demandCommand()
    .help()
    .wrap(100)
    .argv;