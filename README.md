# cs348-movie_db

## Backend (Node + Express)

Runs on port `4000`

Install packages: `npm install`

Start: `npm run start`

## Frontend (Typescript + React)

Runs on port `3000`

Install packages: `npm install`

Start: `npm start`

## Database stuff

Create user (movieapp, pass1234)
```sql
CREATE USER 'movieapp'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pass1234';
GRANT ALL PRIVILEGES ON *.* TO 'movieapp'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Import DB (have not tested): `mysql -u movieapp -p moviedb < moviedb.sql`

Export DB:  `mysqldump -u movieapp -p moviedb > moviedb.sql`

## Commands for Mac

To run the sql server: sudo /usr/local/mysql/bin/mysql -u root -p


## How to create database schema

`SELECT @@secure_file_priv;`

```sql
-- Wipe old database
DROP DATABASE moviedb;

-- Create new database and use it
CREATE DATABASE moviedb;
USE moviedb;

-- Create tables with no references
CREATE TABLE idLinks(mlID INT NOT NULL, imdbID INT NOT NULL, tmdbID INT NOT NULL, PRIMARY KEY(mlID), UNIQUE (imdbID), UNIQUE (tmdbID));
CREATE TABLE tags(tagID INT NOT NULL, tagTitle VARCHAR(65) NOT NULL, PRIMARY KEY(tagID));

-- Create tables with references
CREATE TABLE genre(mlID INT NOT NULL, genre VARCHAR(11) NOT NULL, PRIMARY KEY(mlID, genre), FOREIGN KEY(mlID) REFERENCES idLinks(mlID));
CREATE TABLE mlMovies(mlID INT NOT NULL, mlTitle VARCHAR(200) NOT NULL, releaseYear INT NOT NULL, PRIMARY KEY(mlID), FOREIGN KEY(mlID) REFERENCES idLinks(mlID));
CREATE TABLE tagScores(mlID INT NOT NULL, tagID INT NOT NULL, score DECIMAL(21, 20) NOT NULL, PRIMARY KEY(mlID, tagID), FOREIGN KEY(mlID) REFERENCES idLinks(mlID), FOREIGN KEY(tagID) REFERENCES tags(tagID));
CREATE TABLE popularMovies(tmdbID INT NOT NULL, voteCount INT NOT NULL, selectID INT NOT NULL, PRIMARY KEY(tmdbID), FOREIGN KEY(tmdbID) REFERENCES idLinks(tmdbID), UNIQUE(selectID));
CREATE TABLE majorActors(imdbID INT NOT NULL, actorID INT NOT NULL, actorName VARCHAR(30) NOT NULL, PRIMARY KEY(imdbID, actorID), FOREIGN KEY(imdbID) REFERENCES idLinks(imdbID));
CREATE TABLE motds(challengeDate VARCHAR(10) NOT NULL, selectID INT NOT NULL, PRIMARY KEY(challengeDate), FOREIGN KEY(selectID) REFERENCES popularMovies(selectID));
-- BINARY(16) more efficient for userCookie: https://stackoverflow.com/questions/43056220/store-uuid-v4-in-mysql
CREATE TABLE userPlays(challengeDate VARCHAR(10) NOT NULL, userCookie VARCHAR(36) NOT NULL, guessNumber INT NOT NULL, mlID INT NOT NULL, PRIMARY KEY(challengeDate, userCookie, guessNumber), FOREIGN KEY(challengeDate) REFERENCES motds(challengeDate), FOREIGN KEY(mlID) REFERENCES idLinks(mlID));

-- Load CSV file into tables
LOAD DATA INFILE '/var/lib/mysql-files/idLinks.csv' INTO TABLE idLinks FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
LOAD DATA INFILE '/var/lib/mysql-files/tags.csv' INTO TABLE tags FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
LOAD DATA INFILE '/var/lib/mysql-files/genre.csv' INTO TABLE genre FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
LOAD DATA INFILE '/var/lib/mysql-files/mlMovies.csv' INTO TABLE mlMovies FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
LOAD DATA INFILE '/var/lib/mysql-files/tagScores.csv' INTO TABLE tagScores FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
LOAD DATA INFILE '/var/lib/mysql-files/popularMovies.csv' INTO TABLE popularMovies FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
LOAD DATA INFILE '/var/lib/mysql-files/majorActors.csv' INTO TABLE majorActors FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
```