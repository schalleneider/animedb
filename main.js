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
        desc: 'where the information will be retrieved. available options: [ anilist, myanimelist, youtube ]'
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
    .usage('usage: main.js <command> [options]')
    .command({
        command: 'seasons [options]',
        desc: 'imports anime information based on a season list',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: node main.js seasons --env=dev --source='anilist|myanimelist'")
        },
        handler: async (argv) =>  {
            await (new Program(argv.env).runSeasons(argv.source, argv.archive, argv.archivePath));
            Log.info('main : seasons command completed...');
        }
    })
    .command({
        command: 'personal [options]',
        desc: 'imports anime information based on a personal list',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: node main.js personal --env=dev --source='anilist'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runPersonal(argv.source, argv.archive, argv.archivePath));
            Log.info('main : personal command completed...');
        }
    })
    .command({
        command: 'scout [options]',
        desc: 'scout anime information on myanimelist based on anilist entries',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: node main.js scout --env=dev --source='myanimelist'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runScout(argv.source, argv.archive, argv.archivePath));
            Log.info('main : scout command completed...');
        }
    })
    .command({
        command: 'themes [options]',
        desc: 'imports opening and ending themes from myanimelist',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: node main.js themes --env=dev --source='myanimelist'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runThemes(argv.source, argv.archive, argv.archivePath));
            Log.info('main : themes command completed...');
        }
    })
    .command({
        command: 'medias [options]',
        desc: 'imports media information for themes from youtube',
        builder: (yargs) => { yargs
            .options(commandOptions)
            .demandOption(requiredOptions, "example: node main.js medias --env=dev --source='youtube'")
        },
        handler: async (argv) => {
            await (new Program(argv.env).runMedias(argv.source, argv.archive, argv.archivePath));
            Log.info('main : media command completed...');
        }
    })
    .demandCommand()
    .help()
    .wrap(150)
    .argv;