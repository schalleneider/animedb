-- DROPS

DROP TABLE Personal;
DROP TABLE AniList_MyAnimeList;
DROP TABLE SourceType;
DROP TABLE Download;
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
    "SearchSequence" INTEGER,
    "IsLicensed" INTEGER,
    "IsBestRank" INTEGER,
    "IsFinalChoice" INTEGER,
    "Rank" INTEGER,
    "SearchType" TEXT,
    "Address" TEXT,
    "CreatedOn" TEXT,
    "LastModifiedOn" TEXT,
    PRIMARY KEY("Id")
    FOREIGN KEY("ThemeId") REFERENCES "Theme"("Id")
);

CREATE TABLE "Download" (
    "Id" INTEGER,
    "KeyId" INTEGER,
    "Address" TEXT,
    "Artist" TEXT,
    "Title" TEXT,
    "Album" TEXT,
    "Path" TEXT,
    "Status" TEXT,
    "CreatedOn" TEXT,
    "LastModifiedOn" TEXT,
    PRIMARY KEY("Id")
    FOREIGN KEY("KeyId") REFERENCES "Media"("Id")
);