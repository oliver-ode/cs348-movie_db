WITH movie_of_the_day AS (
    SELECT i.mlID
    FROM dailyMovies d
    JOIN tmdbPopularMovies t ON d.selectID = t.selectID
    JOIN idLinks i ON t.tmdbID = i.tmdbID
    WHERE d.challengeDate = CURDATE()
),
daily_movie_year AS (
    SELECT ml.releaseYear
    FROM mlMoviesWithYears ml
    JOIN idLinks idl ON ml.mlID = idl.mlID
    JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID
    JOIN dailyMovies dm ON tm.selectID = dm.selectID
    WHERE dm.challengeDate = CURDATE()
)
SELECT
0 AS isCorrect,
m.mlTitle AS title,
m.releaseYear AS year,
'regular' AS yearProximity,
GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts,
GROUP_CONCAT(DISTINCT g.genre ORDER BY g.genre SEPARATOR ', ') AS genres,
GROUP_CONCAT(DISTINCT t.tagTitle ORDER BY ts.score DESC SEPARATOR ', ') AS tags
FROM mlMoviesWithYears m
JOIN movie_of_the_day motd ON m.mlID = motd.mlID
LEFT JOIN idLinks i ON m.mlID = i.mlID
LEFT JOIN genres g ON m.mlID = g.mlID
LEFT JOIN imdbActors a ON i.imdbID = a.imdbID
LEFT JOIN tagScores ts ON m.mlID = ts.mlID
LEFT JOIN tags t ON ts.tagID = t.tagID
GROUP BY m.mlID, m.mlTitle, m.releaseYear;
