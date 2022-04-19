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
                'source' : { type : 'string' },
                'archive' : { type : 'boolean', default: false },
                'archivePath' : { type : 'string' }
            })
            .demandOption([ 'source', 'archive' ], "example: node main.js seasons --source='anilist|myanimelist'")
        },
        handler: async (argv) =>  {
            await (new Program().runSeasons(argv.source, argv.archive, argv.archivePath));
            Log.info('main : seasons command completed...');
        }
    })
    .command({
        command: 'personal [options]',
        desc: 'imports anime information based on a personal list',
        builder: (yargs) => { yargs
            .options({
                'source' : { type : 'string' },
                'archive' : { type : 'boolean', default: false },
                'archivePath' : { type : 'string' }
            })
            .demandOption([ 'source', 'archive' ], "example: node main.js personal --source='anilist'")
        },
        handler: async (argv) => {
            await (new Program().runPersonal(argv.source, argv.archive, argv.archivePath));
            Log.info('main : personal command completed...');
        }
    })
    .command({
        command: 'scout [options]',
        desc: 'scout anime information on myanimelist based on anilist entries',
        builder: (yargs) => { yargs
            .options({
                'source' : { type : 'string' },
                'archive' : { type : 'boolean', default: false },
                'archivePath' : { type : 'string' }
            })
            .demandOption([ 'source', 'archive' ], "example: node main.js scout --source='myanimelist'")
        },
        handler: async (argv) => {
            await (new Program().runScout(argv.source, argv.archive, argv.archivePath));
            Log.info('main : scout command completed...');
        }
    })
    .command({
        command: 'themes [options]',
        desc: 'imports opening and ending themes from myanimelist',
        builder: (yargs) => { yargs
            .options({
                'source' : { type : 'string' },
                'archive' : { type : 'boolean', default: false },
                'archivePath' : { type : 'string' }
            })
            .demandOption([ 'source', 'archive' ], "example: node main.js themes --source='myanimelist'")
        },
        handler: async (argv) => {
            await (new Program().runThemes(argv.source, argv.archive, argv.archivePath));
            Log.info('main : themes command completed...');
        }
    })
    .command({
        command: 'medias [options]',
        desc: 'imports media information for themes from youtube',
        builder: (yargs) => { yargs
            .options({
                'source' : { type : 'string' },
                'archive' : { type : 'boolean', default: false },
                'archivePath' : { type : 'string' }
            })
            .demandOption([ 'source', 'archive' ], "example: node main.js medias --source='youtube'")
        },
        handler: async (argv) => {
            await (new Program().runMedias(argv.source, argv.archive, argv.archivePath));
            Log.info('main : media command completed...');
        }
    })
    .demandCommand()
    .help()
    .wrap(100)
    .argv;