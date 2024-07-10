-- Set the variables for the challenge date, user cookie, and guess number
SET @cookie = 'be36fbac-f364-4b4f-b531-4baba05fc596'; -- Adjust user cookie as necessary

WITH guess_tags AS (
    SELECT ts.tagID, ts.score
    FROM tagScores ts
    JOIN guesses g ON ts.mlID = g.mlID
    WHERE g.challengeDate = CURDATE()
    AND ts.score > 0.5
    AND g.userCookie = @cookie
    AND g.guessNumber = (SELECT COUNT(gs.guessNumber) FROM guesses gs WHERE gs.challengeDate = CURDATE() AND userCookie = @cookie)
),
motd_tags AS (
  SELECT ts.tagID
  FROM dailyMovies dm
  JOIN tmdbPopularMovies tp ON dm.selectID = tp.selectID
  JOIN idLinks idl ON tp.tmdbID = idl.tmdbID
  JOIN tagScores ts ON idl.mlID = ts.mlID
  WHERE ts.score > 0.5
)
SELECT t.tagTitle
FROM tags t
JOIN guess_tags gt ON t.tagID = gt.tagID
JOIN motd_tags mt ON gt.tagID = mt.tagID
ORDER BY gt.score DESC
LIMIT 3;