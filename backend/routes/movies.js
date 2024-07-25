const express = require("express");
const mysqlConnection = require("../utils/database");

const Router = express.Router();

const MAX_MOVIES_TO_CHOOSE_FROM = 1000;
const MAX_GUESSES = 10;
const MAX_SEARCH_RETURN = 10;

Router.get("/getFormat", (req, res) => {
  let sql = ''
  mysqlConnection.query(
    "SELECT * FROM dailyMovies WHERE challengeDate=CURDATE();",
    (err, results, fields) => {
      if (!err) {
        let selectID;
        // Generate a new movie of the day
        if (results.length == 0) {
          let cont = true;
          while (cont) {
            selectID = Math.floor(Math.random() * MAX_MOVIES_TO_CHOOSE_FROM + 1);
            sql = "SELECT * FROM dailyMovies WHERE selectID=?;";
            cont = false;
            mysqlConnection.query(sql, [selectID],
              (err_, results_, fields_) => {
                if (!err_) {
                  cont = results_.length != 0;
                } else {
                  console.error(err_);
                  cont = false;
                }
              }
            );
          }
          sql = 'INSERT INTO dailyMovies VALUES (CURDATE(), ?);';
          mysqlConnection.query(sql, [selectID],
            (err_, results_, fields_) => {
              if (err_) console.error(`Could not insert into dailyMovies. Error ${err_}`)
            }
          );
        }
        else {
          selectID = results[0]['selectID'];
        }
        sql = "SELECT mlTitle FROM tmdbPopularMovies pm, idLinks idl, mlMoviesWithYears mlm WHERE ?=pm.selectID AND pm.tmdbID=idl.tmdbID AND idl.mlID=mlm.mlID";
        mysqlConnection.query(sql, [selectID],
          (err_, results_, fields) => {
            if (!err_) {
              if (results_.length == 1) {
                res.send({'titleFormat': results_[0]['mlTitle'].replace(/[(a-z|0-9)]/gi, '_').split('').join(' ')});
              } else {
                console.error('Does not exist or exists too many times');
              }
            } else console.error(err_);
          }
        );
      } else console.error(err);
    }
  );
});


Router.get("/titleSearch", (req, res) => {
  let params = req.query;
  const sql = "SELECT * FROM mlMoviesWithYears WHERE mlTitle LIKE ? ORDER BY releaseYear DESC LIMIT ?;";
  mysqlConnection.query(sql, ['%'+params.title+'%', MAX_SEARCH_RETURN],
    (err, results, fields) => {
      if (!err) {
        res.send({'results': Object.values(JSON.parse(JSON.stringify(results)))});
      } else {
        console.log(err);
      }
    }
  );
});


Router.get("/getExistingGuesses", (req, res) => {
  let query = req.query;
  let totalGuesses; 
  let response = [];
  // let correctMovie = {};
  let gaveUp = false;
  let sql = "SELECT MAX(guessNumber) maxgn, MIN(guessNumber) mingn FROM guesses WHERE userCookie=? AND challengeDate=CURDATE();";
  mysqlConnection.query(sql, [query.userID],
    (err, results, fields) => {
      if (!err) {
        sql = "WITH movie_of_the_day AS (\
            SELECT i.mlID\
            FROM dailyMovies d\
            JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
            JOIN idLinks i ON t.tmdbID = i.tmdbID\
            WHERE d.challengeDate = CURDATE()\
        ),\
        daily_movie_year AS (\
          SELECT ml.releaseYear\
          FROM mlMoviesWithYears ml\
          JOIN idLinks idl ON ml.mlID = idl.mlID\
          JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID\
          JOIN dailyMovies dm ON tm.selectID = dm.selectID\
          WHERE dm.challengeDate = CURDATE()\
        )\
        SELECT\
          0 AS isCorrect,\
          m.mlTitle AS title,\
          m.releaseYear AS year,\
          'regular' AS yearProximity,\
          GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts,\
          GROUP_CONCAT(DISTINCT g.genre ORDER BY g.genre SEPARATOR ', ') AS genres,\
          GROUP_CONCAT(DISTINCT t.tagTitle ORDER BY ts.score DESC SEPARATOR ', ') AS tags\
        FROM mlMoviesWithYears m\
        JOIN movie_of_the_day motd ON m.mlID = motd.mlID\
        LEFT JOIN idLinks i ON m.mlID = i.mlID\
        LEFT JOIN genres g ON m.mlID = g.mlID\
        LEFT JOIN imdbActors a ON i.imdbID = a.imdbID\
        LEFT JOIN tagScores ts ON m.mlID = ts.mlID\
        LEFT JOIN tags t ON ts.tagID = t.tagID\
        GROUP BY m.mlID, m.mlTitle, m.releaseYear;"

        mysqlConnection.query(sql, [], (err_, results_, fields_) => {
          if (!err) {
            if (results[0]['mingn'] == -1*MAX_GUESSES) {
              let resp = results_[0];
              resp['isCorrect'] = 0;
              resp['giveUp'] = 1;
              resp['guess'] = 0;
              resp['casts'] = resp['casts'].split(', ').map((actorName) => ({ actorName, proximity: 'same' }))
              resp['genres'] = resp['genres'].split(', ').map((genre) => ({ genre, proximity: 'same' }))
              resp['tags'] = resp['tags'].split(', ').map((tag) => ({ tag, proximity: 'regular' }))
              response.push(resp);
              gaveUp = true;
            }
            totalGuesses = results[0]['maxgn'];
            for (let i = 1; i <= totalGuesses; i++) {
              sql = "SELECT\
                CASE\
                  WHEN (SELECT dm.selectID FROM dailyMovies dm WHERE dm.challengeDate = CURDATE()) = (SELECT tm.selectID FROM guesses g JOIN mlMoviesWithYears ml ON g.mlID = ml.mlID JOIN idLinks idl ON ml.mlID = idl.mlID JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID WHERE g.guessNumber = ? AND g.userCookie = ? AND g.challengeDate = CURDATE()) THEN 1\
                  ELSE 0\
                END AS isCorrect;";
              
              mysqlConnection.query(sql, [i, query.userID], (err__, results__, fields__) => {
                if (err__) {
                  console.error('Error executing query:', err__);
                  return;
                }
                sql = "WITH guessed_movie AS ( \
                  SELECT g.mlID \
                  FROM guesses g \
                  WHERE g.challengeDate = CURDATE() \
                    AND g.userCookie = ? \
                    AND g.guessNumber = ? \
                  ), \
                  daily_movie_year AS ( \
                    SELECT ml.releaseYear \
                    FROM dailyMovies dm \
                    JOIN tmdbPopularMovies tm ON dm.selectID = tm.selectID \
                    JOIN idLinks idl ON tm.tmdbID = idl.tmdbID \
                    JOIN mlMoviesWithYears ml ON idl.mlID = ml.mlID \
                    WHERE dm.challengeDate = CURDATE() \
                  ) \
                  SELECT \
                    0 AS isCorrect, \
                    g.guessNumber AS guess, \
                    m.mlTitle AS title, \
                    '' AS studio, \
                    m.releaseYear AS year, \
                    CASE \
                      WHEN ((SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear) > 5  THEN 'high' \
                      WHEN ((SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear) <= 5 AND ((SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear > 0) THEN 'yellowhigh'\
                      WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) = m.releaseYear THEN 'correct' \
                      WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear < -5 THEN 'low' \
                      WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear >= -5 and (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear < 0 THEN 'yellowlow' \
                    END AS yearProximity, \
                    GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts, \
                    GROUP_CONCAT(DISTINCT ge.genre ORDER BY ge.genre SEPARATOR ', ') AS genres \
                  FROM mlMoviesWithYears m \
                  JOIN guessed_movie gm ON m.mlID = gm.mlID \
                  JOIN guesses g ON m.mlID = g.mlID \
                  LEFT JOIN idLinks i ON m.mlID = i.mlID \
                  LEFT JOIN genres ge ON m.mlID = ge.mlID \
                  LEFT JOIN imdbActors a ON i.imdbID = a.imdbID \
                  WHERE g.challengeDate = CURDATE() \
                    AND g.userCookie = ? \
                    AND g.guessNumber = ? \
                  GROUP BY m.mlID, g.guessNumber, m.mlTitle, m.releaseYear; \
                  \
                  \
                  \
                  WITH guessed_movie AS (\
                      SELECT g.mlID\
                      FROM guesses g\
                      WHERE g.challengeDate = CURDATE()\
                        AND g.userCookie = ?\
                        AND g.guessNumber = ? \
                  ),\
                  guess_tags AS ( \
                      SELECT ts.tagID, ts.score \
                      FROM tagScores ts\
                      JOIN guessed_movie g on ts.mlID = g.mlID\
                      where ts.score > 0.7 \
                  ), \
                  movie_of_the_day AS (\
                      SELECT i.mlID\
                      FROM dailyMovies d\
                      JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
                      JOIN idLinks i ON t.tmdbID = i.tmdbID\
                      WHERE d.challengeDate = CURDATE()\
                  ),\
                  motd_tags AS ( \
                      SELECT ts.tagID, ts.score \
                      FROM tagScores ts\
                      join movie_of_the_day m on ts.mlID = m.mlID \
                  ), \
                  join_tags AS ( \
                      SELECT gt.tagID, mt.score \
                      FROM guess_tags gt \
                      JOIN motd_tags mt ON gt.tagID = mt.tagID \
                  ),  \
                  top_tags as (\
                    SELECT t.tagTitle, jt.score\
                    FROM tags t \
                    JOIN join_tags jt ON t.tagID = jt.tagID \
                    ORDER BY jt.score DESC \
                    LIMIT 5\
                  )\
                  SELECT DISTINCT t.tagTitle,\
                  CASE\
                      WHEN t.score >= 0.7  THEN 'same'\
                      WHEN t.score >= 0.5 and t.score <0.7  THEN 'adjacent'\
                      WHEN t.score < 0.5 THEN 'no'\
                    END AS proximity\
                  FROM top_tags t;\
                  \
                  \
                  \
                  \
                  WITH guessed_movie AS (\
                      SELECT g.mlID\
                      FROM guesses g\
                      WHERE g.challengeDate = CURDATE()\
                        AND g.userCookie = ?\
                        AND g.guessNumber = ? \
                  ),\
                  movie_of_the_day AS (\
                      SELECT i.mlID\
                      FROM dailyMovies d\
                      JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
                      JOIN idLinks i ON t.tmdbID = i.tmdbID\
                      WHERE d.challengeDate = CURDATE()\
                  ),\
                  today_actors AS (\
                      SELECT a.actorID, a.actorName\
                      FROM imdbActors a\
                      JOIN idLinks il ON a.imdbID = il.imdbID\
                      WHERE il.mlID = (SELECT mlID FROM movie_of_the_day)\
                  ),\
                  guessed_movie_actors AS (\
                      SELECT a.actorID, a.actorName\
                      FROM imdbActors a\
                      JOIN idLinks il ON a.imdbID = il.imdbID\
                      WHERE il.mlID = (SELECT mlID FROM guessed_movie)\
                  ),\
                  all_today_actor_movies AS (\
                    SELECT DISTINCT il.imdbID\
                    FROM imdbActors ia\
                    JOIN idLinks il ON ia.imdbID = il.imdbID\
                    WHERE ia.actorID IN (SELECT actorID FROM today_actors)\
                      and il.mlID != (select mlID from guessed_movie)\
                  ),\
                  actors_acted_with_today_movie_actors AS (\
                    SELECT DISTINCT ia.actorID\
                    FROM imdbActors ia\
                    WHERE ia.imdbID in (SELECT imdbID FROM all_today_actor_movies)\
                  )\
                  SELECT ga.actorName,\
                  ga.actorID,\
                  CASE\
                    WHEN ga.actorID IN (SELECT actorID FROM today_actors) THEN 'same'\
                    WHEN ga.actorID IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'adjacent'\
                    WHEN ga.actorID NOT IN (SELECT actorID FROM today_actors) AND ga.actorID NOT IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'no'\
                  END AS proximity\
                  FROM guessed_movie_actors ga;\
                  \
                  \
                  \
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
                          AND g.userCookie = ?\
                          AND g.guessNumber = ? \
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
                    FROM guessed_movie_genres gg;"
                
                mysqlConnection.query(sql, [query.userID, i, query.userID, i, query.userID, i, query.userID, i, query.userID, i], (err___, results___, fields___) => {
                  if (err___) {
                    console.error('Error executing query:', err___);
                    return;
                  }
                  let resp = results___[0][0];
                  resp['tags'] = results___[1];
                  resp['casts'] = results___[2];
                  resp['genres'] = results___[3];
                  resp['isCorrect'] = results__[0]['isCorrect']==1;
                  resp['giveUp'] = 0;
                  resp['maxGuessesReached'] = totalGuesses==MAX_GUESSES;
                  response.push(resp);
                  if (response.length == totalGuesses+gaveUp) {
                    res.send(response);
                  }
                });
              });
            }
            if (totalGuesses < 1) res.send(response);
          } else {
            console.error('Error executing query:', err);
          }
        });
      } else {
        console.log(err);
      }
    }
  );
});


Router.get("/giveUp", (req, res) => {
  let query = req.query;
  let sql = "insert ignore into guesses values (CURDATE(), ?, ? , 1);";
  
  for(let i = 1; i <= MAX_GUESSES; i++){
    mysqlConnection.query(sql, [query.userID, -1*i],
      (err, results, fields) => {
        if (err){
          console.log(err);
        }
      }
    )
  }

  sql = "WITH movie_of_the_day AS (\
          SELECT i.mlID\
          FROM dailyMovies d\
          JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
          JOIN idLinks i ON t.tmdbID = i.tmdbID\
          WHERE d.challengeDate = CURDATE()\
      ),\
      daily_movie_year AS (\
        SELECT ml.releaseYear\
        FROM mlMoviesWithYears ml\
        JOIN idLinks idl ON ml.mlID = idl.mlID\
        JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID\
        JOIN dailyMovies dm ON tm.selectID = dm.selectID\
        WHERE dm.challengeDate = CURDATE()\
      )\
      SELECT\
        0 AS isCorrect,\
        m.mlTitle AS title,\
        m.releaseYear AS year,\
        'regular' AS yearProximity,\
        GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts,\
        GROUP_CONCAT(DISTINCT g.genre ORDER BY g.genre SEPARATOR ', ') AS genres,\
        GROUP_CONCAT(DISTINCT t.tagTitle ORDER BY ts.score DESC SEPARATOR ', ') AS tags\
      FROM mlMoviesWithYears m\
      JOIN movie_of_the_day motd ON m.mlID = motd.mlID\
      LEFT JOIN idLinks i ON m.mlID = i.mlID\
      LEFT JOIN genres g ON m.mlID = g.mlID\
      LEFT JOIN imdbActors a ON i.imdbID = a.imdbID\
      LEFT JOIN tagScores ts ON m.mlID = ts.mlID\
      LEFT JOIN tags t ON ts.tagID = t.tagID\
      GROUP BY m.mlID, m.mlTitle, m.releaseYear;"

  mysqlConnection.query(sql, [], (err, results, fields) => {
    if (!err) {
      let resp = results[0];
      resp['isCorrect'] = 0;
      resp['giveUp'] = 1;
      resp['guess'] = 0;
      resp['casts'] = resp['casts'].split(', ').map((actorName) => ({ actorName, proximity: 'same' }))
      resp['genres'] = resp['genres'].split(', ').map((genre) => ({ genre, proximity: 'same' }))
      resp['tags'] = resp['tags'].split(', ').map((tag) => ({ tag, proximity: 'regular' }))
      res.send(resp);
    } else {
      console.error('Error executing query:', err);
    }
  });
});


Router.post("/makeGuess", (req, res) => {
  let body = req.body;
  let sql = "SELECT COUNT(*) totalGuesses FROM guesses WHERE challengeDate=CURDATE() AND userCookie=?;";
  mysqlConnection.query(sql, [body.userID],
    (err, results, fields) => {
      if (!err) {
        sql = "INSERT INTO guesses VALUES (CURDATE(), ?, (SELECT mgn FROM (SELECT COUNT(*)+1 mgn FROM guesses WHERE userCookie=? AND challengeDate=CURDATE() AND guessNumber>0) t), ?)";
        mysqlConnection.query(sql, [body.userID, body.userID, body.guessMLID], (err_, results_, fields_) => {
          if (!err_) {
            sql = "SELECT\
              CASE\
                WHEN (SELECT dm.selectID FROM dailyMovies dm WHERE dm.challengeDate = CURDATE()) = (SELECT tm.selectID FROM guesses g JOIN mlMoviesWithYears ml ON g.mlID = ml.mlID JOIN idLinks idl ON ml.mlID = idl.mlID JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID WHERE g.guessNumber = (SELECT COUNT(gs.guessNumber) FROM guesses gs WHERE gs.challengeDate = CURDATE() AND userCookie = ?) AND g.userCookie = ? AND g.challengeDate = CURDATE()) THEN 1\
                ELSE 0\
              END AS isCorrect;";
            
            mysqlConnection.query(sql, [body.userID, body.userID], (err__, results__, fields__) => {
              if (err__) {
                console.error('Error executing query:', err__);
                return;
              }
              sql = "WITH guessed_movie AS ( \
              SELECT g.mlID \
              FROM guesses g \
              WHERE g.challengeDate = CURDATE() \
                AND g.userCookie = ? \
                AND g.guessNumber = ( \
                  SELECT mgn \
                  FROM (SELECT COUNT(*) AS mgn \
                        FROM guesses \
                        WHERE userCookie = ? \
                          AND challengeDate = CURDATE()) AS subquery1 \
                ) \
              ), \
              daily_movie_year AS ( \
                SELECT ml.releaseYear \
                FROM dailyMovies dm \
                JOIN tmdbPopularMovies tm ON dm.selectID = tm.selectID \
                JOIN idLinks idl ON tm.tmdbID = idl.tmdbID \
                JOIN mlMoviesWithYears ml ON idl.mlID = ml.mlID \
                WHERE dm.challengeDate = CURDATE() \
              ) \
              SELECT \
                0 AS isCorrect, \
                g.guessNumber AS guess, \
                m.mlTitle AS title, \
                '' AS studio, \
                m.releaseYear AS year, \
                CASE \
                      WHEN ((SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear) > 5  THEN 'high' \
                      WHEN ((SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear) <= 5 AND ((SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear > 0) THEN 'yellowhigh'\
                      WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) = m.releaseYear THEN 'correct' \
                      WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear < -5 THEN 'low' \
                      WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear >= -5 and (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) - m.releaseYear < 0 THEN 'yellowlow' \
                    END AS yearProximity, \
                GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts, \
                GROUP_CONCAT(DISTINCT ge.genre ORDER BY ge.genre SEPARATOR ', ') AS genres \
              FROM mlMoviesWithYears m \
              JOIN guessed_movie gm ON m.mlID = gm.mlID \
              JOIN guesses g ON m.mlID = g.mlID \
              LEFT JOIN idLinks i ON m.mlID = i.mlID \
              LEFT JOIN genres ge ON m.mlID = ge.mlID \
              LEFT JOIN imdbActors a ON i.imdbID = a.imdbID \
              WHERE g.challengeDate = CURDATE() \
                AND g.userCookie = ? \
                AND g.guessNumber = ( \
                    SELECT mgn \
                    FROM (SELECT COUNT(*) AS mgn \
                          FROM guesses \
                          WHERE userCookie = ? \
                            AND challengeDate = CURDATE()) AS subquery1 \
                  ) \
              GROUP BY m.mlID, g.guessNumber, m.mlTitle, m.releaseYear; \
              \
              \
              \
              WITH guessed_movie AS (\
                  SELECT g.mlID\
                  FROM guesses g\
                  WHERE g.challengeDate = CURDATE()\
                    AND g.userCookie = ?\
                    AND g.guessNumber = (\
                      SELECT COUNT(*) AS mgn\
                      FROM guesses\
                      WHERE userCookie = ?\
                      AND challengeDate = CURDATE()\
                    )\
              ),\
              guess_tags AS ( \
                  SELECT ts.tagID, ts.score \
                  FROM tagScores ts\
                  JOIN guessed_movie g on ts.mlID = g.mlID\
                  where ts.score > 0.7 \
              ), \
              movie_of_the_day AS (\
                  SELECT i.mlID\
                  FROM dailyMovies d\
                  JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
                  JOIN idLinks i ON t.tmdbID = i.tmdbID\
                  WHERE d.challengeDate = CURDATE()\
              ),\
              motd_tags AS ( \
                  SELECT ts.tagID, ts.score \
                  FROM tagScores ts\
                  join movie_of_the_day m on ts.mlID = m.mlID \
              ), \
              join_tags AS ( \
                  SELECT gt.tagID, mt.score \
                  FROM guess_tags gt \
                  JOIN motd_tags mt ON gt.tagID = mt.tagID \
              ),  \
              top_tags as (\
                SELECT t.tagTitle, jt.score\
                FROM tags t \
                JOIN join_tags jt ON t.tagID = jt.tagID \
                ORDER BY jt.score DESC \
                LIMIT 5\
              )\
              SELECT DISTINCT t.tagTitle,\
              CASE\
                  WHEN t.score >= 0.7  THEN 'same'\
                  WHEN t.score >= 0.5 and t.score <0.7  THEN 'adjacent'\
                  WHEN t.score < 0.5 THEN 'no'\
                END AS proximity\
              FROM top_tags t;\
              \
              \
              \
              \
              WITH guessed_movie AS (\
                  SELECT g.mlID\
                  FROM guesses g\
                  WHERE g.challengeDate = CURDATE()\
                    AND g.userCookie = ?\
                    AND g.guessNumber = (\
                      SELECT COUNT(*) AS mgn\
                            FROM guesses\
                            WHERE userCookie = ?\
                              AND challengeDate = CURDATE()\
                    )\
              ),\
              movie_of_the_day AS (\
                  SELECT i.mlID\
                  FROM dailyMovies d\
                  JOIN tmdbPopularMovies t ON d.selectID = t.selectID\
                  JOIN idLinks i ON t.tmdbID = i.tmdbID\
                  WHERE d.challengeDate = CURDATE()\
              ),\
              today_actors AS (\
                  SELECT a.actorID, a.actorName\
                  FROM imdbActors a\
                  JOIN idLinks il ON a.imdbID = il.imdbID\
                  WHERE il.mlID = (SELECT mlID FROM movie_of_the_day)\
              ),\
              guessed_movie_actors AS (\
                  SELECT a.actorID, a.actorName\
                  FROM imdbActors a\
                  JOIN idLinks il ON a.imdbID = il.imdbID\
                  WHERE il.mlID = (SELECT mlID FROM guessed_movie)\
              ),\
              all_today_actor_movies AS (\
                SELECT DISTINCT il.imdbID\
                FROM imdbActors ia\
                JOIN idLinks il ON ia.imdbID = il.imdbID\
                WHERE ia.actorID IN (SELECT actorID FROM today_actors)\
                  and il.mlID != (select mlID from guessed_movie)\
              ),\
              actors_acted_with_today_movie_actors AS (\
                SELECT DISTINCT ia.actorID\
                FROM imdbActors ia\
                WHERE ia.imdbID in (SELECT imdbID FROM all_today_actor_movies)\
              )\
              SELECT ga.actorName,\
              ga.actorID,\
              CASE\
                WHEN ga.actorID IN (SELECT actorID FROM today_actors) THEN 'same'\
                WHEN ga.actorID IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'adjacent'\
                WHEN ga.actorID NOT IN (SELECT actorID FROM today_actors) AND ga.actorID NOT IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'no'\
              END AS proximity\
              FROM guessed_movie_actors ga;\
              \
              \
              \
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
                      AND g.userCookie = ?\
                      AND g.guessNumber = (\
                        SELECT COUNT(*) AS mgn\
                        FROM guesses\
                        WHERE userCookie = ?\
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
                FROM guessed_movie_genres gg;"
              
              mysqlConnection.query(sql, [body.userID, body.userID, body.userID, body.userID, body.userID, body.userID, body.userID, body.userID, body.userID, body.userID], (err___, results___, fields___) => {
                if (err___) {
                  console.error('Error executing query:', err___);
                  return;
                }
                let response = results___[0][0];
                response['tags'] = results___[1];
                response['casts'] = results___[2];
                response['genres'] = results___[3];
                response['isCorrect'] = results__[0]['isCorrect']==1;
                response['giveUp'] = 0;
                response['maxGuessesReached'] = results[0]['totalGuesses'] == MAX_GUESSES-1;
                if(response['isCorrect']){
                  sql = "insert ignore into guesses values (CURDATE(), ?, ? , 1);";

                  for(let i = 1; i <= MAX_GUESSES+1; i++){
                    mysqlConnection.query(sql, [body.userID, -1*i],
                      (err, results, fields) => {
                        if (err){
                          console.log(err);
                        }
                      }
                    )
                  }

                }

                res.send(response);
              });
            });
          } else {
            console.log(err_);
          }
        });
      } else {
        console.log(err);
      }
    }
  );
});

module.exports = Router;