SET @user_cookie = 'be36fbac-f364-4b4f-b531-4baba05fc596';

WITH guessed_movie AS (
    SELECT g.mlID, g.guessNumber
    FROM guesses g
    WHERE g.challengeDate = CURDATE()
    AND g.userCookie = @user_cookie
    AND g.guessNumber in (
        SELECT max(guessNumber)
            FROM guesses
            WHERE userCookie = @user_cookie
                AND challengeDate = CURDATE()
    )
)
SELECT
  0 AS isCorrect,
  g.guessNumber AS guess,
  m.mlTitle AS title,
  '' AS studio,
  m.releaseYear AS year,
  GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts,
  GROUP_CONCAT(DISTINCT ge.genre ORDER BY ge.genre SEPARATOR ', ') AS genres
FROM mlMoviesWithYears m
JOIN guessed_movie gm ON m.mlID = gm.mlID
JOIN guesses g ON m.mlID = g.mlID
LEFT JOIN idLinks i ON m.mlID = i.mlID
LEFT JOIN genres ge ON m.mlID = ge.mlID
LEFT JOIN imdbActors a ON i.imdbID = a.imdbID
WHERE g.challengeDate = CURDATE()
  AND g.userCookie = @user_cookie
  AND g.guessNumber = gm.guessNumber
GROUP BY m.mlID, g.guessNumber, m.mlTitle, m.releaseYear;