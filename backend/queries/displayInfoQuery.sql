SET @user_guess = 'Jumanji'; -- Replace with actual user input

-- Step 1: Retrieve the mlID for the guessed movie using selectID
WITH guessed_movie AS (
    SELECT m.mlID
    FROM mlMoviesWithYears m
    WHERE m.mlTitle = @user_guess
)
-- Step 2: Retrieve the basic information about the guessed movie
SELECT         
    m.mlTitle AS title,
    m.releaseYear AS release_year,
    GROUP_CONCAT(DISTINCT g.genre ORDER BY g.genre SEPARATOR ', ') AS genres,
    GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ',') AS actors

FROM mlMoviesWithYears m
LEFT JOIN idLinks i ON m.mlID = i.mlID
LEFT JOIN genre g ON m.mlID = g.mlID
LEFT JOIN imdbActors a ON i.imdbID = a.imdbID

WHERE m.mlID = (SELECT mlID FROM guesses)
GROUP BY m.mlID, m.mlTitle, m.releaseYear;
