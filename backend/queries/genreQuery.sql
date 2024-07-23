\
-- Set the variables for the challenge date and guessed movie title\
SET @cookie = 'be36fbac-f364-4b4f-b531-4baba05fc596';\

WITH movie_of_the_day AS (\
    SELECT i.mlID\
    FROM dailyMovies d\
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
    JOIN idLinks i ON t.tmdbID = i.tmdbID\
    WHERE d.challengeDate = CURDATE()\
),\
movie_of_the_day_genres AS (\
    SELECT g.genre\
    FROM genres g\
    where g.mlID = (select mlID from movie_of_the_day)\
),\
guessed_movie AS (\
    SELECT g.mlID\
    FROM guesses g\
    WHERE g.challengeDate = CURDATE()\
      AND g.userCookie = @cookie\
      AND g.guessNumber = (\
        SELECT COUNT(*) AS mgn\
        FROM guesses\
        WHERE userCookie = @cookie\
        AND challengeDate = CURDATE()\
      )\
),\
guessed_movie_genres AS (\
    SELECT g.genre\
    FROM genres g\
    JOIN guessed_movie gm ON g.mlID = gm.mlID\
),\
overlapping_genres AS (\
    SELECT DISTINCT g.genre\
    FROM movie_of_the_day_genres g\
    JOIN guessed_movie_genres gg ON g.genre = gg.genre\
)\
SELECT gg.genre,\
CASE\
  WHEN gg.genre IN (SELECT genre FROM overlapping_genres) THEN 'same'\
  WHEN gg.genre NOT IN (SELECT genre FROM overlapping_genres) THEN 'no'\
END AS proximity\
FROM guessed_movie_genres gg;



