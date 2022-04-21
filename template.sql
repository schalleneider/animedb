-- DROPS

DROP VIEW v_MyAnimeListToScout;
DROP VIEW v_ThemesToSearch;
DROP VIEW v_MediasToSearch;
DROP VIEW v_MyAnimeListScoutMismatch;
DROP VIEW v_ThemesInError;

DROP TABLE Personal;
DROP TABLE AniList_MyAnimeList;
DROP TABLE SourceType;
DROP TABLE Media;
DROP TABLE AniList;
DROP TABLE MyAnimeList;
DROP TABLE Theme;
DROP TABLE Source;
DROP TABLE User;

-- TABLES

CREATE TABLE "User" (
    "Id" INTEGER,
    "Name" TEXT,
    "CreatedOn" TEXT,
    PRIMARY KEY("Id")
);

CREATE TABLE "SourceType" (
    "Id" INTEGER,
    "Key" TEXT,
    "Name" TEXT,
    "CreatedOn" TEXT,
    PRIMARY KEY("Id")
);

CREATE TABLE "Source" (
    "Id" INTEGER,
    "KeyId" TEXT,
    "ExternalId" INTEGER,
    "SourceTypeId" INTEGER,
    "CreatedOn" TEXT,
    PRIMARY KEY("Id"),
    UNIQUE("KeyId"),
    FOREIGN KEY("SourceTypeId") REFERENCES "SourceType"("Id")
);

CREATE TABLE "AniList" (
    "Id" INTEGER,
    "Title" TEXT,
    "Type" TEXT,
    "Format" TEXT,
    "Season" TEXT,
    "SeasonYear" INTEGER,
    "Genres" TEXT,
    "NumberOfEpisodes" INTEGER,
    "StartDate" TEXT,
    "StartWeekNumber" INTEGER,
    "StartDayOfWeek" TEXT,
    "HasPrequel" INTEGER,
    "HasSequel" INTEGER,
    "Status" TEXT,
    "Address" TEXT,
    "CreatedOn" TEXT,
    "LastModifiedOn" TEXT,
    PRIMARY KEY("Id")
);

CREATE TABLE "MyAnimeList" (
    "Id" INTEGER,
    "Title" TEXT,
    "Type" TEXT,
    "Season" TEXT,
    "SeasonYear" TEXT,
    "NumberOfEpisodes" INTEGER,
    "StartDate" TEXT,
    "EndDate" TEXT,
    "Status" TEXT,
    "CreatedOn" TEXT,
    "LastModifiedOn" TEXT,
    PRIMARY KEY("Id")
);

CREATE TABLE "AniList_MyAnimeList" (
    "AniListId" INTEGER,
    "MyAnimeListId" INTEGER,
    "CreatedOn" TEXT,
    "LastModifiedOn" TEXT,
    PRIMARY KEY("MyAnimeListId","AniListId"),
    FOREIGN KEY("MyAnimeListId") REFERENCES "MyAnimeList"("Id"),
    FOREIGN KEY("AniListId") REFERENCES "AniList"("Id")
);

CREATE TABLE "Personal" (
    "UserId" INTEGER,
    "AniListId" INTEGER,
    "Status" TEXT,
    "CreatedOn" TEXT,
    PRIMARY KEY("AniListId","UserId"),
    FOREIGN KEY("AniListId") REFERENCES "AniList"("Id"),
    FOREIGN KEY("UserId") REFERENCES "User"("Id")
);

CREATE TABLE "Theme" (
    "Id" INTEGER,
    "KeyId" TEXT,
	"Theme" TEXT,
    "Artist" TEXT,
    "Title" TEXT,
    "Type" TEXT,
    "Sequence" INTEGER,
	"Algorithm" TEXT,
    "CreatedOn" TEXT,
    PRIMARY KEY("Id"),
    FOREIGN KEY("KeyId") REFERENCES "Source"("KeyId")
);

CREATE TABLE "Media" (
    "Id" INTEGER,
    "ThemeId" INTEGER,
    "KeyId" TEXT,
    "Title" TEXT,
    "Description" TEXT,
    "Duration" TEXT,
    "DurationSeconds" INTEGER,
    "NumberOfViews" INTEGER,
    "NumberOfLikes" INTEGER,
    "IsLicensed" INTEGER,
    "IsFirstResult" INTEGER,
    "IsBestRank" INTEGER,
    "Rank" INTEGER,
    "Address" TEXT,
    "CreatedOn" TEXT,
    "LastModifiedOn" TEXT,
    PRIMARY KEY("Id")
    FOREIGN KEY("ThemeId") REFERENCES "Theme"("Id")
);

-- VIEWS

CREATE VIEW v_MyAnimeListToScout
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
        MyAnimeList.Id NOT IN (
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