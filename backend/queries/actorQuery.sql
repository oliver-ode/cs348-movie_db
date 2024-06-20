-- Set the variables for the challenge date and guessed movie title
SET @challenge_date = '2024-06-19'; -- Adjust date as necessary
SET @guessed_movie_title = 'Ocean\'s Eleven'; -- Replace with actual user input

-- Step 1: Retrieve the mlID of today's movie
WITH movie_of_the_day AS (
    SELECT mlID
    FROM dailyMovies
    WHERE challengeDate = @challenge_date
),

-- Step 2: Retrieve the actors from today's movie
today_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM movie_of_the_day)
),

-- Step 3: Retrieve the mlID of the guessed movie
guessed_movie AS (
    SELECT mlID
    FROM mlMoviesWithYears
    WHERE mlTitle = @guessed_movie_title
),

-- Step 4: Retrieve the actors from the guessed movie
guessed_movie_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM guessed_movie)
)

-- Step 5: Find and list actors from the guessed movie who have acted with actors from today's movie in different movies
SELECT DISTINCT
    ga.actorName AS GuessedMovieActor,
    ta.actorName AS SecretMovieActor
FROM guessed_movie_actors ga
JOIN imdbActors ia1 ON ga.actorID = ia1.actorID
JOIN idLinks il1 ON ia1.imdbID = il1.imdbID
JOIN imdbActors ta ON il1.imdbID = ta.imdbID
JOIN idLinks il2 ON ta.imdbID = il2.imdbID
JOIN today_actors ta2 ON ta.actorID = ta2.actorID
WHERE il1.mlID != il2.mlID; -- Ensure that the movies are different
