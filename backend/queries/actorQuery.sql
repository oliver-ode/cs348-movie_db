-- Set the variables for the challenge date and guessed movie title
SET @cookie = '49faa1b8-f8d4-4a4f-a68d-315b3de29df6';

WITH guessed_movie AS (
    SELECT g.mlID
    FROM guesses g
    WHERE g.challengeDate = CURDATE()
      AND g.userCookie = @cookie
      AND g.guessNumber = (
        SELECT mgn
        FROM (SELECT COUNT(*) AS mgn
              FROM guesses
              WHERE userCookie = @cookie
                AND challengeDate = CURDATE()) AS subquery1
      )
),
movie_of_the_day AS (
    SELECT i.mlID
    FROM dailyMovies d
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE d.challengeDate = CURDATE()
),
today_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM movie_of_the_day)
),
guessed_movie_actors AS (
    SELECT a.actorID, a.actorName
    FROM imdbActors a
    JOIN idLinks il ON a.imdbID = il.imdbID
    WHERE il.mlID = (SELECT mlID FROM guessed_movie)
),
all_today_actor_movies AS (
  SELECT DISTINCT il.imdbID
  FROM imdbActors ia
  JOIN idLinks il ON ia.imdbID = il.imdbID
  WHERE ia.actorID IN (SELECT actorID FROM today_actors) AND 
    il.imdbID != (select i.imdbID from idLinks i where i.imdbId = movie_of_the_day)
),
actors_acted_with_today_movie_actors AS (
  SELECT DISTINCT ia.actorID
  FROM imdbActors ia
  WHERE ia.imdbID IN (SELECT imdbID FROM all_today_actor_movies)
)
SELECT ga.actorName,
ga.actorID,
CASE
  WHEN ga.actorID IN (SELECT actorID FROM today_actors) THEN 'same'
  WHEN ga.actorID IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'adjacent'
  WHEN ga.actorID NOT IN (SELECT actorID FROM today_actors) AND ga.actorID NOT IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'no'
END AS proximity
FROM guessed_movie_actors ga;