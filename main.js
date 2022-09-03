import yargs from 'yargs';

import { Program } from './program.js';
import { Log } from './log.js';

let commandOptions = {
    'env' : {
        type : 'string',
        desc: 'environment name. available options: [ dev, live ]',
        default: 'dev'
    },
    'source' : {
        type : 'string',
        desc: 'where the information will be retrieved. available options: [ anilist, myanimelist, youtube, animedb ]'
    },
    'archive' : {
        type : 'boolean',
        desc: 'switch to enable information processing from archived file.',
        default: false
    },
    'archivePath' : {
        type : 'string',
        desc: 'path to the archive file to use as source of information when archive switch is enabled.'
    }
};

let requiredOptions = [ 'env', 'source', 'archive'];

let argv = (yargs)(process.argv.slice(2))
    .usage('usage: ./animedb.exe <command> [options]')
    .command({
        command: 'seasons [options]',
        desc: 'use to get anime information from a season list',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe seasons --env=env --source='anilist|myanimelist'")
        },
        handler: async (argv) =>  {
            await (new Program(argv.env).runSeasons(argv.source, argv.archive, argv.archivePath));
            Log.info('main : seasons command completed...');
        }
    })
    .command({
        command: 'personal [options]',
        desc: 'use to get anime information from a personal list',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe personal --env=env --source='anilist'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runPersonal(argv.source, argv.archive, argv.archivePath));
            Log.info('main : personal command completed...');
        }
    })
    .command({
        command: 'scout [options]',
        desc: 'use to scout anime information on myanimelist from anilist entries',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe scout --env=env --source='myanimelist'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runScout(argv.source, argv.archive, argv.archivePath));
            Log.info('main : scout command completed...');
        }
    })
    .command({
        command: 'themes [options]',
        desc: 'use to get opening and ending themes from myanimelist',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe themes --env=env --source='myanimelist'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runThemes(argv.source, argv.archive, argv.archivePath));
            Log.info('main : themes command completed...');
        }
    })
    .command({
        command: 'medias [options]',
        desc: 'use to get themes media information from youtube',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe medias --env=env --source='youtube'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runMedias(argv.source, argv.archive, argv.archivePath));
            Log.info('main : media command completed...');
        }
    })
    .command({
        command: 'batch [options]',
        desc: 'use to batch media information to prepare for download',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe batch --env=env --source='animedb'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runBatch(argv.source, argv.archive, argv.archivePath));
            Log.info('main : batch command completed...');
        }
    })
    .command({
        command: 'download [options]',
        desc: 'use to download media information from youtube',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe download --env=env --source='animedb'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runDownload(argv.source, argv.archive, argv.archivePath));
            Log.info('main : download command completed...');
        }
    })
    .command({
        command: 'tags [options]',
        desc: 'use to update metadata information from downloaded media',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe tags --env=env --source='animedb'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runTags(argv.source, argv.archive, argv.archivePath));
            Log.info('main : tags command completed...');
        }
    })
    .command({
        command: 'animepick [options]',
        desc: 'use to get anime information from a manual list of identifiers',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe animepick --env=env --source='animedb'")
        },
        handler: async (argv) =>  {
            await (new Program(argv.env).runAnimePick(argv.source, argv.archive, argv.archivePath));
            Log.info('main : animepick command completed...');
        }
    })
    .command({
        command: 'themespick [options]',
        desc: 'use to get themes media information from a manual list of identifiers',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe themespick --env=env --source='animedb'")
        },
        handler: async (argv) =>  {
            await (new Program(argv.env).runThemesPick(argv.source, argv.archive, argv.archivePath));
            Log.info('main : themespick command completed...');
        }
    })
    .command({
        command: 'mediapick [options]',
        desc: 'use to get media information from a manual list of youtube videos',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: ./animedb.exe mediapick --env=env --source='animedb'")
        },
        handler: async (argv) =>  {
            await (new Program(argv.env).runMediaPick(argv.source, argv.archive, argv.archivePath));
            Log.info('main : mediapick command completed...');
        }
    })
    .demandCommand()
    .help()
    .wrap(150)
    .argv;