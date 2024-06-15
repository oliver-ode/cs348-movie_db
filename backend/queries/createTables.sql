CREATE TABLE idLinks(
    mlID INT 
    tmdbID INT 
    imdbID INT
)

CREATE TABLE pastDailyMovies(
    challengeDate DATE 
    mlID INT
)

CREATE TABLE genre(
    challengeDate DATE 
    mlID INT
)

CREATE TABLE mlMoviesWithYears(
    mlID INT
    mlTitle VARCHAR(100)
    releaseYear INT
)

CREATE TABLE tagScores(
    mlID INT 
    tagID INT 
    score FLOAT
)

CREATE TABLE tagMeaning(
    tagID INT 
    tagTitle VARCHAR(65)
)

CREATE TABLE tmdbMovies(
    tmdbID INT 
    tmdbTitle VARCHAR(104)
)

CREATE TABLE tmdbPopularMovies(
    tmdbTitle VARCHAR(104)
)

CREATE TABLE imdbActors(
    imdbID INT 
    actorID INT
    actorName VARCHAR(30)
)