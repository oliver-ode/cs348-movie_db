-- Set the variables for the challenge date, user cookie, and guess number 
SET @cookie = 'be36fbac-f364-4b4f-b531-4baba05fc596'; -- Adjust user cookie as necessary 

-- select guessed movie
WITH guessed_movie AS (
    SELECT g.mlID
    FROM guesses g
    WHERE g.challengeDate = CURDATE()
      AND g.userCookie = @cookie
      AND g.guessNumber = (
        SELECT COUNT(*) AS mgn
        FROM guesses
        WHERE userCookie = @cookie
        AND challengeDate = CURDATE()
      )
),
-- Retrieve the tagIDs and tagScores of the guessed movie that are > 0.5
guess_tags AS ( 
    SELECT ts.tagID, ts.score 
    FROM tagScores ts
    JOIN guessed_movie g on ts.mlID = g.mlID
    where ts.score > 0.7 
), 
-- retrieve the movie of the day
movie_of_the_day AS (
    SELECT i.mlID
    FROM dailyMovies d
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE d.challengeDate = CURDATE()
),
-- Retrieve the tagIDs and tagScores of the movie of the day using selectID 
motd_tags AS ( 
    SELECT ts.tagID, ts.score 
    FROM tagScores ts
    join movie_of_the_day m on ts.mlID = m.mlID 
), 
-- get overlapping tags
join_tags AS ( 
    SELECT gt.tagID, mt.score 
    FROM guess_tags gt 
    JOIN motd_tags mt ON gt.tagID = mt.tagID 
),  
-- Get the top five tags for the movie of the day 
top_tags as (
  SELECT t.tagTitle, jt.score
  FROM tags t 
  JOIN join_tags jt ON t.tagID = jt.tagID 
  ORDER BY jt.score DESC 
  LIMIT 5
)
SELECT t.tagTitle,
CASE
    WHEN t.score >= 0.7  THEN 'same'
    WHEN t.score >= 0.5 and t.score <0.7  THEN 'adjacent'
    WHEN t.score < 0.5 THEN 'no'
  END AS proximity
FROM top_tags t;
