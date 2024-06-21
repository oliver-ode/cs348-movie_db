-- Set the variable for the challenge date
SET @challenge_date = '2024-06-19'; -- Adjust date as necessary

-- Step 1: Retrieve the mlID of today's movie
WITH movie_of_the_day AS (
    SELECT i.mlID
    FROM dailyMovies d
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE d.challengeDate = @challenge_date
)

-- Step 2: Get the top three tags for the movie of the day
SELECT tm.tagTitle
FROM tagScores ts
JOIN tagMeaning tm ON ts.tagID = tm.tagID
WHERE ts.mlID = (SELECT mlID FROM movie_of_the_day)
ORDER BY ts.score DESC
LIMIT 3 \G