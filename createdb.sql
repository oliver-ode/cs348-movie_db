-- Wipe old database
DROP DATABASE IF EXISTS moviedb;

-- Create new database and use it
CREATE DATABASE moviedb;
USE moviedb;

-- Create tables with no references
CREATE TABLE idLinks (
    mlID INT NOT NULL,
    imdbID INT NOT NULL,
    tmdbID INT NOT NULL,
    PRIMARY KEY (mlID),
    UNIQUE (imdbID),
    UNIQUE (tmdbID)
);

CREATE TABLE tags (
    tagID INT NOT NULL,
    tagTitle VARCHAR(65) NOT NULL,
    PRIMARY KEY (tagID)
);

-- Create tables with references
CREATE TABLE genres (
    mlID INT NOT NULL,
    genre VARCHAR(11) NOT NULL,
    PRIMARY KEY (mlID, genre),
    FOREIGN KEY (mlID) REFERENCES idLinks (mlID)
);

CREATE TABLE mlMoviesWithYears (
    mlID INT NOT NULL,
    mlTitle VARCHAR(200) NOT NULL,
    releaseYear INT NOT NULL,
    PRIMARY KEY (mlID),
    FOREIGN KEY (mlID) REFERENCES idLinks (mlID)
);

CREATE TABLE tagScores (
    mlID INT NOT NULL,
    tagID INT NOT NULL,
    score DECIMAL(21, 20) NOT NULL,
    PRIMARY KEY (mlID, tagID),
    FOREIGN KEY (mlID) REFERENCES idLinks (mlID),
    FOREIGN KEY (tagID) REFERENCES tags (tagID)
);

CREATE TABLE tmdbPopularMovies (
    tmdbID INT NOT NULL,
    selectID INT NOT NULL,
    PRIMARY KEY (tmdbID),
    FOREIGN KEY (tmdbID) REFERENCES idLinks (tmdbID),
    UNIQUE (selectID)
);

CREATE TABLE imdbActors (
    imdbID INT NOT NULL,
    actorID INT NOT NULL,
    actorName VARCHAR(30) NOT NULL,
    PRIMARY KEY (imdbID, actorID),
    FOREIGN KEY (imdbID) REFERENCES idLinks (imdbID)
);

CREATE TABLE dailyMovies (
    challengeDate VARCHAR(10) NOT NULL,
    selectID INT NOT NULL,
    PRIMARY KEY (challengeDate),
    FOREIGN KEY (selectID) REFERENCES tmdbPopularMovies (selectID)
);

CREATE TABLE guesses (
    challengeDate VARCHAR(10) NOT NULL,
    userCookie VARCHAR(36) NOT NULL,
    guessNumber INT NOT NULL,
    mlID INT NOT NULL,
    PRIMARY KEY (challengeDate, userCookie, guessNumber),
    FOREIGN KEY (challengeDate) REFERENCES dailyMovies (challengeDate),
    FOREIGN KEY (mlID) REFERENCES idLinks (mlID)
);

-- Set local infile to true
SET GLOBAL local_infile=1;

-- Load data from CSV files
LOAD DATA LOCAL INFILE 'backend/tables/idLinks.csv'
INTO TABLE idLinks
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'backend/tables/tags.csv'
INTO TABLE tags
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'backend/tables/genre.csv'
INTO TABLE genres
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'backend/tables/mlMovies.csv'
INTO TABLE mlMoviesWithYears
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'backend/tables/tagScores.csv'
INTO TABLE tagScores
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'backend/tables/popularMovies.csv'
INTO TABLE tmdbPopularMovies
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'backend/tables/majorActors.csv'
INTO TABLE imdbActors
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
