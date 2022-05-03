-- DROPS

DROP VIEW v_AniListToScout;
DROP VIEW v_ThemesToSearch;
DROP VIEW v_MediasToSearch;
DROP VIEW v_MyAnimeListScoutMismatch;
DROP VIEW v_ThemesInError;
DROP VIEW v_PersonalList;

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