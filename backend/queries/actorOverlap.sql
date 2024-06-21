-- Set the variables for the challenge date and guessed movie title
SET @challenge_date = '2024-06-19'; -- Adjust date as necessary
SET @guessed_movie_title = 'Ocean\'s Eleven'; -- Replace with actual user input

-- Step 1: Retrieve the mlID of today's movie using selectID
WITH movie_of_the_day AS (
    SELECT i.mlID
    FROM dailyMovies d
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE d.challengeDate = @challenge_date
),

-- Step 2: Retrieve the actors from today's movie
today_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM movie_of_the_day)
),

-- Step 3: Retrieve the mlID of the guessed movie using selectID
guessed_movie AS (
    SELECT i.mlID
    FROM mlMoviesWithYears m
    JOIN idLinks i ON m.mlID = i.mlID
    JOIN tmdbPopularMovies t ON i.tmdbID = t.tmdbID
    WHERE m.mlTitle = @guessed_movie_title
),

-- Step 4: Retrieve the actors from the guessed movie
guessed_movie_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM guessed_movie)
)

-- Step 5: List the actors that are in both guessed movie and today's movie
SELECT ga.actorName 
FROM guessed_movie_actors ga
WHERE ga.actorID IN (SELECT ta.actorID FROM today_actors ta);
