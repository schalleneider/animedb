import fs from 'fs';
import path from 'path';
import exceljs from 'exceljs';
import { execSync } from 'child_process';

import { Facade } from './facade.js';

import { AniList } from './anilist.js';
import { MyAnimeList } from './myanimelist.js';
import { YouTube } from './youtube.js';

import { Log } from '../log.js';
import { Common } from '../common.js';
import { Archive } from '../archive.js';

class AnimeDB extends Facade {

    constructor(database) {
        super(database);
        this.aniListFacade = new AniList(this.database);
        this.myAnimeListFacade = new MyAnimeList(this.database);
        this.youtubeFacade = new YouTube(this.database);
    }

    async getBatch(criteria) {

        let batchList = [];

        let medias = await this.database.getMedias(criteria);

        for (let mediasIndex = 0; mediasIndex < medias.length; mediasIndex++) {

            const currentMedia = medias[mediasIndex];

            Log.info(`animedb : batching media to download : [ ${currentMedia.MediaAddress} - ${currentMedia.ThemeArtist} - ${currentMedia.ThemeTitle} ]`);
        
            let item = {
                media: {
                    id: currentMedia.MediaId
                },
                download: {
                    id: currentMedia.ThemeId,
                    address: currentMedia.MediaAddress,
                    artist: currentMedia.ThemeArtist,
                    title: currentMedia.ThemeTitle,
                    album: Common.parseDownloadAlbum(currentMedia),
                    status: 'READY_TO_DOWNLOAD'
                }
            };

            // file name parsed after extracting download metadata
            item.download.fileName = Common.parseDownloadFileName(item);

            // trace batch information
            Log.trace(`animedb : parsed batch entry : [ ${item.media.id}, ${item.download.fileName} ]`);

            batchList.push(item);

            await Common.sleep(criteria.delay);
        }

        Archive.save(batchList, 'animedb_batch');

        return batchList;
    }

    async getAnimeByPickList(criteria) {
        let aniListAnimes = await this.aniListFacade.getAnimeByPickList(criteria);
        let myAnimeListAnimes = await this.myAnimeListFacade.getAnimeByPickList(criteria);
        let animes = this.mergeAnimeList(criteria, aniListAnimes, myAnimeListAnimes);
        Archive.save(animes, 'animedb_animepick');
        return animes
    }
    
    async getAnimeThemesByPickList(criteria) {
        let animes = await this.myAnimeListFacade.getAnimeThemesByPickList(criteria);
        Archive.save(animes, 'animedb_themespick');
        return animes
    }
    
    async getMediaByPickList(criteria) {
        let medias = await this.youtubeFacade.getMediaByPickList(criteria);
        Archive.save(medias, 'animedb_mediapick');
        return medias
    }

    async saveBatch(batch) {
        Log.info(`animedb : saving batch : [ ${batch.length} entries ]`);
        await this.database.saveBatch(batch);
    }

    async saveAnimePick(animes) {
        Log.info(`animedb : saving anime pick : [ ${animes.length} entries ]`);
        await this.aniListFacade.saveAnimePick(animes);
        await this.myAnimeListFacade.saveAnimePick(animes);
    }
    
    async saveThemesPick(animes) {
        Log.info(`animedb : saving themes pick : [ ${animes.length} entries ]`);
        await this.myAnimeListFacade.saveThemesPick(animes);
    }
    
    async saveMediaPick(medias) {
        Log.info(`animedb : saving media pick : [ ${medias.length} entries ]`);
        await this.youtubeFacade.saveMediaPick(medias);
    }

    async processDownload(criteria) {

        let processResults = { success: 0, errors: 0 };
        
        const youtubedl = path.join(path.resolve(criteria.binPath), "youtube-dl.exe");
        
        let downloads = await this.database.getDownloads(criteria);

        for (let downloadsIndex = 0; downloadsIndex < downloads.length; downloadsIndex++) {
            
            const currentDownload = downloads[downloadsIndex];

            Log.info(`animedb : processing download : [ ${currentDownload.DownloadFileName} - ${currentDownload.DownloadAddress} ]`);

            try {

                const outputPath = path.join(path.resolve(criteria.outputPath), `${currentDownload.DownloadFileName}.%(ext)s`);
                const address = currentDownload.DownloadAddress;
                const args = `-f "${criteria.mediaFormat}" -ciw -o "${outputPath}" --extract-audio --audio-quality ${criteria.audioQuality} --audio-format ${criteria.audioFormat} "${address}"`;
            
                execSync(`${youtubedl} ${args}`, { stdio: 'inherit' });

                await this.database.saveDownload(currentDownload.DownloadId, criteria.nextStatus);

                processResults.success++;

            } catch (error) {
                Log.error(`[ ${currentDownload.DownloadFileName} - ${currentDownload.DownloadAddress} ] : ${error.message}`);
                processResults.errors++;
            }
            
            await Common.sleep(criteria.delay);
        }

        Log.info(`animedb : download process completed : [ success: ${processResults.success}, errors: ${processResults.errors} ]`);
    }

    async processTags(criteria) {

        let processResults = { success: 0, errors: 0 };
        
        const tageditor = path.join(path.resolve(criteria.binPath), "tageditor.exe");
        
        let downloads = await this.database.getDownloads(criteria);

        for (let downloadsIndex = 0; downloadsIndex < downloads.length; downloadsIndex++) {
            
            const currentDownload = downloads[downloadsIndex];

            Log.info(`animedb : processing tags : [ ${currentDownload.DownloadFileName} - ${currentDownload.DownloadAddress} ]`);

            try {

                const currentMediaFile = path.join(path.resolve(criteria.outputPath), `${currentDownload.DownloadFileName}.${criteria.audioFormat}`);
                
                if (!fs.existsSync(currentMediaFile)) {
                    throw new Error(`[ ${currentMediaFile} ] file not found`);
                }

                const args = `-s title="${currentDownload.DownloadTitle}" artist="${currentDownload.DownloadArtist}" album="${currentDownload.DownloadAlbum}" track="${currentDownload.DownloadId}" --max-padding 100000 -f "${currentMediaFile}"`;
                execSync(`${tageditor} ${args}`, { stdio: 'inherit' });
                
                await this.database.saveDownload(currentDownload.DownloadId, criteria.nextStatus);

                processResults.success++;

            } catch (error) {
                Log.error(`[ ${currentDownload.DownloadFileName} - ${currentDownload.DownloadAddress} ] : ${error.message}`);
                processResults.errors++;
            }
            
            await Common.sleep(criteria.delay);
        }

        Log.info(`animedb : tags process completed : [ success: ${processResults.success}, errors: ${processResults.errors} ]`);
    }

    async processPlaylist(criteria) {

        let processResults = { success: 0, errors: 0 };
        
        let downloads = await this.database.getDownloads(criteria);

        Log.info(`animedb : processing playlist : [ ${criteria.playlistName} ]`);

        try {
            
            let writeStream = fs.createWriteStream(path.join(path.resolve(criteria.outputPath), `${criteria.playlistName}.${criteria.playlistFormat}`), { flags: "w", encoding: "utf-8" });

            for (let downloadsIndex = 0; downloadsIndex < downloads.length; downloadsIndex++) {
                
                const currentDownload = downloads[downloadsIndex];

                const playlistLine = `${path.join(criteria.basePath, `${currentDownload.DownloadFileName}.${criteria.audioFormat}`)}\n`;

                writeStream.write(playlistLine);

                processResults.success++;
            }
            
            writeStream.end();

        } catch (error) {
            Log.error(`[ ${criteria.playlistName} ] : ${error.message}`);
            processResults.errors++;
        }

        Log.info(`animedb : playlist process completed : [ success: ${processResults.success}, errors: ${processResults.errors} ]`);
    }

    async processTracker(criteria) {
        
        let processResults = { success: 0, errors: 0 };
        
        let animes = await this.database.getAniList(criteria);

        Log.info(`animedb : processing tracker : [ ${criteria.criteria} ]`);

        try {
            
            let workbook = new exceljs.Workbook();
            await workbook.xlsx.readFile(path.resolve(criteria.templatePath));
            let worksheet = workbook.worksheets[0];
            
            for (let animesIndex = 0; animesIndex < animes.length; animesIndex++) {
                
                const currentAnime = animes[animesIndex];

                // calculation of the right position to insert new rows - template is filled from bottom -> up
                let insertRowPosition = ((currentAnime.TrackerStartDayOfWeekNumber - 1) * 2) + 3;

                // row data
                let rowData = [
                    currentAnime.PersonalStatus,
                    currentAnime.AniListStartDayOfWeek,
                    currentAnime.AniListTitle,
                    currentAnime.AniListFormat,
                    currentAnime.AniListNumberOfEpisodes,
                    { text: `#${currentAnime.AniListId}`, hyperlink: currentAnime.AniListAddress },
                    currentAnime.AniListStartDate
                ];

                const newRow = worksheet.insertRow(insertRowPosition, rowData, 'o');

                processResults.success++;
            }
            
            await workbook.xlsx.writeFile(path.resolve(criteria.outputPath));

        } catch (error) {
            Log.error(`[ ${criteria.criteria} ] : ${error.message}`);
            processResults.errors++;
        }

        Log.info(`animedb : tracker process completed : [ success: ${processResults.success}, errors: ${processResults.errors} ]`);
    }

    mergeAnimeList(criteria, aniListAnimes, myAnimeListAnimes) {
        let animeList = [];
        for (let identifierIndex = 0; identifierIndex < criteria.list.length; identifierIndex++) {
            const currentIdentifier = criteria.list[identifierIndex];
            const currentAniListId = parseInt(currentIdentifier.aniListId);
            const currentMyAnimeListId = parseInt(currentIdentifier.myAnimeListId);
            let item = {
                anilist: aniListAnimes.find(element => { 
                    return (element.anilist.id === currentAniListId && element.myanimelist.id === currentMyAnimeListId)
                }).anilist,
                myanimelist: myAnimeListAnimes.find(element => { 
                    return (element.myanimelist.id === currentMyAnimeListId && element.anilist.id === currentAniListId)
                }).myanimelist
            };
            animeList.push(item);
        }
        return animeList;
    }
}

export { AnimeDB };