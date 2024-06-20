-- Define the guessed movie title
SET @user_guess = 'Jumanji'; -- Replace with actual user input

-- Step 1: Retrieve the mlID for the guessed movie
WITH guessed_movie AS (
    SELECT mlID
    FROM mlMoviesWithYears
    WHERE mlTitle = @user_guess
)
-- Step 2: Retrieve the basic information about the guessed movie
SELECT 
    m.mlTitle AS title,
    m.releaseYear AS release_year,
    GROUP_CONCAT(DISTINCT g.genre ORDER BY g.genre SEPARATOR ', ') AS genres,
    GROUP_CONCAT(DISTINCT CONCAT(tm.tagTitle, ': ', ts.score) ORDER BY ts.score DESC SEPARATOR ', ') AS tags_with_scores
FROM mlMoviesWithYears m
LEFT JOIN genre g ON m.mlID = g.mlID
LEFT JOIN tagScores ts ON m.mlID = ts.mlID
LEFT JOIN tagMeaning tm ON ts.tagID = tm.tagID
WHERE m.mlID = (SELECT mlID FROM guessed_movie)
GROUP BY m.mlID, m.mlTitle, m.releaseYear;
