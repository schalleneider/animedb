-- DROPS

DROP VIEW v_AniListToScout;
DROP VIEW v_ThemesToSearch;
DROP VIEW v_MediasToSearch;
DROP VIEW v_MediasToBatch;
DROP VIEW v_MyAnimeListScoutMismatch;
DROP VIEW v_ThemesInError;
DROP VIEW v_PersonalList;
DROP VIEW v_AniList;
DROP VIEW v_MyAnimeList;
DROP VIEW v_Themes;
DROP VIEW v_Medias;
DROP VIEW v_Downloads;
DROP VIEW v_DownloadsReady;
DROP VIEW v_DownloadsToTag;

-- VIEWS

CREATE VIEW v_AniListToScout
AS
    SELECT
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.Status AniListStatus,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM AniList
    INNER JOIN Personal ON Personal.AniListId = AniList.Id
    INNER JOIN User ON User.Id = Personal.UserId
    WHERE 
        AniList.Id NOT IN (
            SELECT DISTINCT 
                AniList_MyAnimeList.AniListId 
            FROM AniList_MyAnimeList
        );

CREATE VIEW v_ThemesToSearch
AS
    SELECT
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.Status AniListStatus,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM MyAnimeList
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId 
    INNER JOIN Personal ON Personal.AniListId = AniList.Id
    INNER JOIN User ON User.Id = Personal.UserId
    WHERE 
        Personal.Status NOT IN ('DROPPED')
    AND MyAnimeList.Id NOT IN (
            SELECT DISTINCT 
                Source.ExternalId 
            FROM Source
            INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList' 
            INNER JOIN Theme ON Theme.KeyId = Source.KeyId
        );

CREATE VIEW v_MediasToSearch
AS
    SELECT
        Theme.Id ThemeId,
        Theme.KeyId ThemeKeyId,
        Theme.Theme ThemeTheme,
        Theme.Artist ThemeArtist,
        Theme.Title ThemeTitle,
        Theme.Type ThemeType,
        Theme.Sequence ThemeSequence,
        Theme.Algorithm ThemeAlgorithm,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.Status AniListStatus,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM Theme
    INNER JOIN Source ON Source.KeyId = Theme.KeyId 
    INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList'
    INNER JOIN MyAnimeList ON MyAnimeList.Id = Source.ExternalId 
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId 
    INNER JOIN Personal ON Personal.AniListId = AniList.Id
    INNER JOIN User ON User.Id = Personal.UserId
    WHERE 
        Theme.Algorithm NOT IN ('ERROR')
    AND Theme.Id NOT IN (
            SELECT DISTINCT 
                Media.ThemeId 
            FROM Media
        );

CREATE VIEW v_MediasToBatch
AS
    SELECT
        Media.Id MediaId,
        Media.ThemeId MediaThemeId,
        Media.KeyId MediaKeyId,
        Media.Title MediaTitle,
        Media.Duration MediaDuration,
        Media.DurationSeconds MediaDurationSeconds,
        Media.NumberOfViews MediaNumberOfViews,
        Media.NumberOfLikes MediaNumberOfLikes,
        Media.SearchSequence MediaSearchSequence,
        Media.IsLicensed MediaIsLicensed,
        Media.IsBestRank MediaIsBestRank,
        Media.IsFinalChoice MediaIsFinalChoice,
        Media.Rank MediaRank,
        Media.SearchType MediaSearchType,
        Media.Address MediaAddress,
        Media.CreatedOn MediaCreatedOn,
        Media.LastModifiedOn MediaLastModifiedOn,
        Theme.Id ThemeId,
        Theme.KeyId ThemeKeyId,
        Theme.Theme ThemeTheme,
        Theme.Artist ThemeArtist,
        Theme.Title ThemeTitle,
        Theme.Type ThemeType,
        Theme.Sequence ThemeSequence,
        Theme.Algorithm ThemeAlgorithm,
        Theme.CreatedOn ThemeCreatedOn,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM Media
    INNER JOIN Theme ON Theme.Id = Media.ThemeId
    INNER JOIN Source ON Source.KeyId = Theme.KeyId 
    INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList'
    INNER JOIN MyAnimeList ON MyAnimeList.Id = Source.ExternalId 
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId
    INNER JOIN Personal ON Personal.AniListId = Anilist.Id
    INNER JOIN User ON User.Id = Personal.UserId
    WHERE 
        Media.IsFinalChoice = 1
    AND Media.Id NOT IN (
            SELECT DISTINCT 
                Download.KeyId 
            FROM Download
        )
    ORDER BY 
        Media.ThemeId, Media.Id ASC;

CREATE VIEW v_MyAnimeListScoutMismatch
AS
    SELECT 
        CAST(ABS((JULIANDAY(AniList.StartDate) - JULIANDAY(MyAnimeList.StartDate))) AS INT) StartDateOffset,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn
    FROM AniList
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.AnilistId = AniList.Id 
    INNER JOIN MyAnimeList ON MyAnimeList.Id = AniList_MyAnimeList.MyAnimeListId
    WHERE
        ABS((JULIANDAY(AniList.StartDate) - JULIANDAY(MyAnimeList.StartDate))) > 0;

CREATE VIEW v_ThemesInError
AS
    SELECT
        Theme.Id ThemeId,
        Theme.KeyId ThemeKeyId,
        Theme.Theme ThemeTheme,
        Theme.Artist ThemeArtist,
        Theme.Title ThemeTitle,
        Theme.Type ThemeType,
        Theme.Sequence ThemeSequence,
        Theme.Algorithm ThemeAlgorithm,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn
    FROM Theme
    INNER JOIN Source ON Source.KeyId = Theme.KeyId 
    INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList'
    INNER JOIN MyAnimeList ON MyAnimeList.Id = Source.ExternalId 
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId
    WHERE 
        Theme.Algorithm IN ('ERROR');

CREATE VIEW v_PersonalList
AS
    SELECT
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM AniList
    INNER JOIN Personal ON Personal.AniListId = AniList.Id
    INNER JOIN User ON User.Id = Personal.UserId;

CREATE VIEW v_Anilist
AS
    SELECT
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM AniList
    INNER JOIN Personal ON Personal.AniListId = Anilist.Id
    INNER JOIN User ON User.Id = Personal.UserId
    ORDER BY 
        AniList.Id ASC;

CREATE VIEW v_MyAnimeList
AS
    SELECT
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM MyAnimeList
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId
    INNER JOIN Personal ON Personal.AniListId = Anilist.Id
    INNER JOIN User ON User.Id = Personal.UserId
    ORDER BY 
        MyAnimeList.Id ASC;    

CREATE VIEW v_Themes
AS
    SELECT
        Theme.Id ThemeId,
        Theme.KeyId ThemeKeyId,
        Theme.Theme ThemeTheme,
        Theme.Artist ThemeArtist,
        Theme.Title ThemeTitle,
        Theme.Type ThemeType,
        Theme.Sequence ThemeSequence,
        Theme.Algorithm ThemeAlgorithm,
        Theme.CreatedOn ThemeCreatedOn,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM Theme
    INNER JOIN Source ON Source.KeyId = Theme.KeyId 
    INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList'
    INNER JOIN MyAnimeList ON MyAnimeList.Id = Source.ExternalId 
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId
    INNER JOIN Personal ON Personal.AniListId = Anilist.Id
    INNER JOIN User ON User.Id = Personal.UserId
    ORDER BY 
        Anilist.Id ASC;

CREATE VIEW v_Medias
AS
    SELECT
        Media.Id MediaId,
        Media.ThemeId MediaThemeId,
        Media.KeyId MediaKeyId,
        Media.Title MediaTitle,
        Media.Description MediaDescription,
        Media.Duration MediaDuration,
        Media.DurationSeconds MediaDurationSeconds,
        Media.NumberOfViews MediaNumberOfViews,
        Media.NumberOfLikes MediaNumberOfLikes,
        Media.SearchSequence MediaSearchSequence,
        Media.IsLicensed MediaIsLicensed,
        Media.IsBestRank MediaIsBestRank,
        Media.IsFinalChoice MediaIsFinalChoice,
        Media.Rank MediaRank,
        Media.SearchType MediaSearchType,
        Media.Address MediaAddress,
        Media.CreatedOn MediaCreatedOn,
        Media.LastModifiedOn MediaLastModifiedOn,
        Theme.Id ThemeId,
        Theme.KeyId ThemeKeyId,
        Theme.Theme ThemeTheme,
        Theme.Artist ThemeArtist,
        Theme.Title ThemeTitle,
        Theme.Type ThemeType,
        Theme.Sequence ThemeSequence,
        Theme.Algorithm ThemeAlgorithm,
        Theme.CreatedOn ThemeCreatedOn,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        Personal.Status PersonalStatus,
        User.Name UserName
    FROM Media
    INNER JOIN Theme ON Theme.Id = Media.ThemeId
    INNER JOIN Source ON Source.KeyId = Theme.KeyId 
    INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList'
    INNER JOIN MyAnimeList ON MyAnimeList.Id = Source.ExternalId 
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId
    INNER JOIN Personal ON Personal.AniListId = Anilist.Id
    INNER JOIN User ON User.Id = Personal.UserId
    ORDER BY
        Media.ThemeId, Media.Id ASC;

CREATE VIEW v_Downloads
AS
    SELECT
        Download.Id DownloadId,
        Download.KeyId DownloadKeyId,
        Download.Address DownloadAddress,
        Download.Artist DownloadArtist,
        Download.Title DownloadTitle,
        Download.Album DownloadAlbum,
        Download.FileName DownloadFileName,
        Download.Status DownloadStatus,
        Download.CreatedOn DownloadCreatedOn,
        Download.LastModifiedOn DownloadLastModifiedOn,
        Media.Id MediaId,
        Media.ThemeId MediaThemeId,
        Media.KeyId MediaKeyId,
        Media.Title MediaTitle,
        Media.Description MediaDescription,
        Media.Duration MediaDuration,
        Media.DurationSeconds MediaDurationSeconds,
        Media.NumberOfViews MediaNumberOfViews,
        Media.NumberOfLikes MediaNumberOfLikes,
        Media.SearchSequence MediaSearchSequence,
        Media.IsLicensed MediaIsLicensed,
        Media.IsBestRank MediaIsBestRank,
        Media.IsFinalChoice MediaIsFinalChoice,
        Media.Rank MediaRank,
        Media.SearchType MediaSearchType,
        Media.Address MediaAddress,
        Media.CreatedOn MediaCreatedOn,
        Media.LastModifiedOn MediaLastModifiedOn,
        Theme.Id ThemeId,
        Theme.KeyId ThemeKeyId,
        Theme.Theme ThemeTheme,
        Theme.Artist ThemeArtist,
        Theme.Title ThemeTitle,
        Theme.Type ThemeType,
        Theme.Sequence ThemeSequence,
        Theme.Algorithm ThemeAlgorithm,
        Theme.CreatedOn ThemeCreatedOn,
        MyAnimeList.Id MyAnimeListId,
        MyAnimeList.Title MyAnimeListTitle,
        MyAnimeList.Type MyAnimeListType,
        MyAnimeList.Season MyAnimeListSeason,
        MyAnimeList.SeasonYear MyAnimeListSeasonYear,
        MyAnimeList.NumberOfEpisodes MyAnimeListNumberOfEpisodes,
        MyAnimeList.StartDate MyAnimeListStartDate,
        MyAnimeList.EndDate MyAnimeListEndDate,
        MyAnimeList.Status MyAnimeListStatus,
        MyAnimeList.CreatedOn MyAnimeListCreatedOn,
        MyAnimeList.LastModifiedOn MyAnimeListLastModifiedOn,
        AniList.Id AniListId,
        AniList.Title AniListTitle,
        AniList.Type AniListType,
        AniList.Format AniListFormat,
        AniList.Season AniListSeason,
        AniList.SeasonYear AniListSeasonYear,
        AniList.Genres AniListGenres,
        AniList.NumberOfEpisodes AniListNumberOfEpisodes,
        AniList.StartDate AniListStartDate,
        AniList.StartWeekNumber AniListStartWeekNumber,
        AniList.StartDayOfWeek AniListStartDayOfWeek,
        AniList.HasPrequel AniListHasPrequel,
        AniList.HasSequel AniListHasSequel,
        AniList.Status AniListStatus,
        AniList.Address AniListAddress,
        AniList.CreatedOn AniListCreatedOn,
        AniList.LastModifiedOn AniListLastModifiedOn,
        Personal.Status PersonalStatus
    FROM Download
    INNER JOIN Media ON Media.Id = Download.KeyId
    INNER JOIN Theme ON Theme.Id = Media.ThemeId
    INNER JOIN Source ON Source.KeyId = Theme.KeyId 
    INNER JOIN SourceType ON SourceType.Id = Source.SourceTypeId AND SourceType.Name = 'MyAnimeList'
    INNER JOIN MyAnimeList ON MyAnimeList.Id = Source.ExternalId 
    INNER JOIN AniList_MyAnimeList ON AniList_MyAnimeList.MyAnimeListId = MyAnimeList.Id 
    INNER JOIN AniList ON AniList.Id = AniList_MyAnimeList.AniListId
    INNER JOIN Personal ON Personal.AniListId = Anilist.Id
    INNER JOIN User ON User.Id = Personal.UserId;

CREATE VIEW v_DownloadsReady
AS
    SELECT
        Download.Id DownloadId,
        Download.KeyId DownloadKeyId,
        Download.Address DownloadAddress,
        Download.Artist DownloadArtist,
        Download.Title DownloadTitle,
        Download.Album DownloadAlbum,
        Download.FileName DownloadFileName,
        Download.Status DownloadStatus,
        Download.CreatedOn DownloadCreatedOn,
        Download.LastModifiedOn DownloadLastModifiedOn
    FROM Download
    WHERE
        Download.Status IN ('READY_TO_DOWNLOAD');

CREATE VIEW v_DownloadsToTag
AS
    SELECT
        Download.Id DownloadId,
        Download.KeyId DownloadKeyId,
        Download.Address DownloadAddress,
        Download.Artist DownloadArtist,
        Download.Title DownloadTitle,
        Download.Album DownloadAlbum,
        Download.FileName DownloadFileName,
        Download.Status DownloadStatus,
        Download.CreatedOn DownloadCreatedOn,
        Download.LastModifiedOn DownloadLastModifiedOn
    FROM Download
    WHERE
        Download.Status IN ('READY_TO_TAG');
