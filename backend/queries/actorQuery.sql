<<<<<<< HEAD
SET @guessed_select_id = 123; -- Replace with actual selectID of the guessed movie
=======
-- Set the variables for the challenge date and guessed movie title
SET @challenge_date = '2024-07-09'; -- Adjust date as necessary
SET @guessed_movie_title = 'The Place Beyond the Pines'; -- Replace with actual user input
>>>>>>> ccd7304253584d8328814484f471d799cf5e0494

-- Step 1: Retrieve the mlID of today's movie using selectID
WITH movie_of_the_day AS (
    SELECT i.mlID
    FROM dailyMovies d
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE d.challengeDate = CURDATE()
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
    SELECT i.mlID
    FROM tmdbPopularMovies t
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE t.selectID = 1
),

-- Step 4: Retrieve the actors from the guessed movie
guessed_movie_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM guessed_movie)
),

-- Step 5: Find all imdb movies that today's movie actors have been in
all_today_actor_movies AS (
    SELECT DISTINCT il.imdbID 
    FROM imdbActors ia 
    JOIN idLinks il ON ia.imdbID = il.imdbID
    WHERE ia.actorID IN (SELECT actorID FROM today_actors)
),

-- Step 6: Find all actors of any movies that today's movie actors have been in
actors_acted_with_today_movie_actors AS (
    SELECT DISTINCT ia.actorID 
    FROM imdbActors ia 
    WHERE ia.imdbID IN (SELECT imdbID FROM all_today_actor_movies)
)

-- Step 7: Return guessed movie actors with their proximity
SELECT 
    ga.actorName AS GuessedMovieActor, 
    ga.actorID,
    CASE 
        WHEN ga.actorID IN (SELECT actorID FROM today_actors) THEN 'same'
        WHEN ga.actorID IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'adjacent'
        ELSE 'no'
    END AS proximity
FROM guessed_movie_actors ga;
