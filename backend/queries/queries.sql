-- 1. Return if any of the actors are in the guessed movie and if they have acted with any actors from today's secret movie 
-- Step 1: Retrieve today's movie details
SET @today := CURDATE();
SET @movie_of_the_day := (SELECT mlID FROM dailyMovies WHERE challengeDate = @today);

-- Step 2: Get actors from today's movie
CREATE TEMPORARY TABLE TodayActors AS
SELECT a.actorID, a.actorName
FROM imdbActors a
JOIN idLinks il ON a.imdbID = il.imdbID
WHERE il.mlID = @movie_of_the_day;

-- Step 3: Get actors from the guessed movie
SET @user_guess := 'Inception'; -- Replace with actual user input
SET @user_guess_id := (SELECT mlID FROM mlMoviesWithYears WHERE mlTitle = @user_guess);

CREATE TEMPORARY TABLE GuessedMovieActors AS
SELECT a.actorID, a.actorName
FROM imdbActors a
JOIN idLinks il ON a.imdbID = il.imdbID
WHERE il.mlID = @user_guess_id;

-- Step 4: Check if any actors from the guessed movie have acted with actors from today's movie
SELECT
    ga.actorName AS GuessedMovieActor,
    ta.actorName AS SecretMovieActor
FROM GuessedMovieActors ga
JOIN imdbActors a ON ga.actorID = a.actorID
JOIN idLinks il ON a.imdbID = il.imdbID
JOIN imdbActors ta ON il.imdbID = ta.imdbID
JOIN TodayActors ta ON ta.actorID = ta.actorID;




-- 2. For the tags in today's movie, return the names and scores of the three tags with the highest scores
-- Step 1: Retrieve the movie of the day
SET @today := CURDATE();
SET @movie_of_the_day := (SELECT mlID FROM dailyMovies WHERE challengeDate = @today);

-- Step 2: Get the top three tags for the movie of the day
SELECT tm.tagTitle, ts.score
FROM tagScores ts
JOIN tagMeaning tm ON ts.tagID = tm.tagID
WHERE ts.mlID = @movie_of_the_day
ORDER BY ts.score DESC
LIMIT 3;




-- 3. Return overlapping genres
-- Step 1: Retrieve the movie of the day
SET @today := CURDATE();
SET @movie_of_the_day := (SELECT mlID FROM dailyMovies WHERE challengeDate = @today);

-- Step 2: Get genres for the movie of the day
CREATE TEMPORARY TABLE MovieOfDayGenres AS
SELECT genre
FROM genre
WHERE mlID = @movie_of_the_day;

-- Step 3: Get genres for the guessed movie
SET @user_guess := 'Inception'; -- Replace with actual user input
SET @user_guess_id := (SELECT mlID FROM mlMoviesWithYears WHERE mlTitle = @user_guess);

CREATE TEMPORARY TABLE GuessedMovieGenres AS
SELECT genre
FROM genre
WHERE mlID = @user_guess_id;

-- Step 4: Find the overlapping genres
SELECT DISTINCT g.genre
FROM MovieOfDayGenres g
JOIN GuessedMovieGenres gg ON g.genre = gg.genre;




-- 4. Display information about the guessed movie
-- Step 1: Define the guessed movie title
SET @user_guess := 'Inception'; -- Replace with actual user input

-- Step 2: Retrieve the mlID for the guessed movie
SET @user_guess_id := (SELECT mlID FROM mlMoviesWithYears WHERE mlTitle = @user_guess);

-- Step 3: Retrieve the basic information about the guessed movie
SELECT 
    m.mlTitle AS title,
    m.releaseYear AS release_year,
    GROUP_CONCAT(DISTINCT g.genre ORDER BY g.genre SEPARATOR ', ') AS genres,
    GROUP_CONCAT(DISTINCT CONCAT(tm.tagTitle, ': ', ts.score) ORDER BY ts.score DESC SEPARATOR ', ') AS tags_with_scores
FROM mlMoviesWithYears m
LEFT JOIN genre g ON m.mlID = g.mlID
LEFT JOIN tagScores ts ON m.mlID = ts.mlID
LEFT JOIN tagMeaning tm ON ts.tagID = tm.tagID
WHERE m.mlID = @user_guess_id
GROUP BY m.mlID, m.mlTitle, m.releaseYear;

--5. Can submit a guess 
CREATE PROCEDURE InsertUserGuess(
    IN p_challengeDate VARCHAR(10),
    IN p_userCookie VARCHAR(36),
    IN p_mlID INT
)
BEGIN
    DECLARE guessCount INT;

    -- Check the number of guesses the user has made for the given date
    SELECT COUNT(*) INTO guessCount
    FROM userPlays
    WHERE challengeDate = p_challengeDate
      AND userCookie = p_userCookie;

    -- If the user has made less than 10 guesses, insert the new guess
    IF guessCount < 10 THEN
        INSERT INTO userPlays (challengeDate, userCookie, guessNumber, mlID)
        VALUES (p_challengeDate, p_userCookie, guessCount + 1, p_mlID);
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User has exceeded the maximum number of guesses for the day';
    END IF;
END //