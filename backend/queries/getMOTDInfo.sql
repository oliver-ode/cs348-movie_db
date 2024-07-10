with motd as (select mlID from idLinks where tmdbId = (
          select tmdbID from tmdbPopularMovies where selectID = (
              select selectID from dailyMovies where challengeDate = CURDATE())))
SELECT
  '' AS guess,
  m.mlTitle AS title,
  '' AS studio,
  m.releaseYear AS year,
  GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts,
  GROUP_CONCAT(DISTINCT ge.genre ORDER BY ge.genre SEPARATOR ', ') AS genres
FROM mlMoviesWithYears m
LEFT JOIN idLinks i ON m.mlID = i.mlID
LEFT JOIN genres ge ON m.mlID = ge.mlID
LEFT JOIN imdbActors a ON i.imdbID = a.imdbID
WHERE m.mlId = (select * from motd)
GROUP BY m.mlID, m.mlTitle, m.releaseYear;
