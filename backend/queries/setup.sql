-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS movie_game;

-- Select the database
USE movie_game;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS genre;
DROP TABLE IF EXISTS tagScores;
DROP TABLE IF EXISTS tagMeaning;
DROP TABLE IF EXISTS imdbActors;
DROP TABLE IF EXISTS dailyMovies;
DROP TABLE IF EXISTS idLinks;
DROP TABLE IF EXISTS tmdbPopularMovies;
DROP TABLE IF EXISTS mlMoviesWithYears;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create tables
CREATE TABLE IF NOT EXISTS mlMoviesWithYears (
    mlID INT PRIMARY KEY,
    mlTitle VARCHAR(255),
    releaseYear INT
);

CREATE TABLE IF NOT EXISTS genre (
    mlID INT,
    genre VARCHAR(50),
    FOREIGN KEY (mlID) REFERENCES mlMoviesWithYears(mlID)
);

CREATE TABLE IF NOT EXISTS tagScores (
    mlID INT,
    tagID INT,
    score FLOAT,
    FOREIGN KEY (mlID) REFERENCES mlMoviesWithYears(mlID)
);

CREATE TABLE IF NOT EXISTS tagMeaning (
    tagID INT PRIMARY KEY,
    tagTitle VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS imdbActors (
    imdbID VARCHAR(10),
    actorID INT,
    actorName VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS tmdbPopularMovies (
    tmdbID INT,
    voteCount INT,
    selectID INT UNIQUE,
    PRIMARY KEY (tmdbID)
);

CREATE TABLE IF NOT EXISTS dailyMovies (
    challengeDate DATE,
    selectID INT,
    FOREIGN KEY (selectID) REFERENCES tmdbPopularMovies(selectID)
);

CREATE TABLE IF NOT EXISTS idLinks (
    mlID INT,
    imdbID VARCHAR(10),
    tmdbID INT,
    PRIMARY KEY (mlID, imdbID, tmdbID)
);

-- Load data into tables
LOAD DATA LOCAL INFILE 'mlMoviesWithYears_sample.csv'
INTO TABLE mlMoviesWithYears
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(mlID, mlTitle, releaseYear);

LOAD DATA LOCAL INFILE 'genre_sample.csv'
INTO TABLE genre
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(mlID, genre);

LOAD DATA LOCAL INFILE 'tagScores_sample.csv'
INTO TABLE tagScores
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(mlID, tagID, score);

LOAD DATA LOCAL INFILE 'tagMeaning.csv'
INTO TABLE tagMeaning
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tagID, tagTitle);

LOAD DATA LOCAL INFILE 'imdbActors_sample.csv'
INTO TABLE imdbActors
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(imdbID, actorID, actorName);

LOAD DATA LOCAL INFILE 'dailyMovies_sample.csv'
INTO TABLE dailyMovies
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(challengeDate, selectID);

LOAD DATA LOCAL INFILE 'idLinks_sample.csv'
INTO TABLE idLinks
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(mlID, imdbID, tmdbID);

LOAD DATA LOCAL INFILE 'tmdbPopularMovies_sample.csv'
INTO TABLE tmdbPopularMovies
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(tmdbID, voteCount, selectID);
