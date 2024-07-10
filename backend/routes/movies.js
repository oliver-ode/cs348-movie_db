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
                res.send({'titleFormat': results_[0]['mlTitle'].replace(/[^\s-]/gi, '_').split('').join(' ')});
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
  const sql = "SELECT * FROM mlMoviesWithYears WHERE mlTitle LIKE ? LIMIT ?;";
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


Router.get("/giveUp", (req, res) => {
  let query = req.query;
  let sql = "insert ignore into guesses values (CURDATE(), ?, ? , 1);";
  
  for(let i = 1; i < 10; i++){
    mysqlConnection.query(sql, [query.userID, -1*i],
      (err, results, fields) => {
        if (err){
          console.log(err);
        }
      }
    )
  }

  sql = "select mlID, mlTitle\
  from mlMoviesWithYears\
  where mlID = (\
      select mlID from idLinks where tmdbId = (\
          select tmdbID from tmdbPopularMovies where selectID = (\
              select selectID from dailyMovies where challengeDate = CURDATE())));";

  mysqlConnection.query(sql,
    (err, results, fields) => {
      if (!err){
        res.send({'MOTD': Object.values(JSON.parse(JSON.stringify(results)))})
      }
      else{
        console.log(err);
      }
    }
  )
});

Router.post("/makeGuess", (req, res) => {
  let body = req.body;
  let sql = "SELECT COUNT(*) totalGuesses FROM guesses WHERE challengeDate=CURDATE() AND userCookie=?;";
  mysqlConnection.query(sql, [body.userID],
    (err, results, fields) => {
      if (!err) {
        if (results[0]['totalGuesses'] >= MAX_GUESSES) {
          res.send({'result': 'over10'})
        }
        else {
          sql = "INSERT INTO guesses VALUES (CURDATE(), ?, (SELECT mgn FROM (SELECT COUNT(*)+1 mgn FROM guesses WHERE userCookie=? AND challengeDate=CURDATE()) t), ?)";
          mysqlConnection.query(sql, [body.userID, body.userID, body.guessMLID], (err_, results_, fields_) => {
            if (!err_) {
              sql = "SELECT\
                CASE\
                  WHEN (SELECT dm.selectID FROM dailyMovies dm WHERE dm.challengeDate = CURDATE()) = (SELECT tm.selectID FROM guesses g JOIN mlMoviesWithYears ml ON g.mlID = ml.mlID JOIN idLinks idl ON ml.mlID = idl.mlID JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID WHERE g.guessNumber = (SELECT COUNT(gs.guessNumber) FROM guesses gs WHERE gs.challengeDate = CURDATE() AND userCookie = ?) AND g.userCookie = ? AND g.challengeDate = CURDATE()) THEN 1\
                  ELSE 0\
                END AS isCorrect;";
              
              mysqlConnection.query(sql, [body.userID, body.userID, body.userID, body.userID], (err__, results__, fields__) => {
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
                    WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) > m.releaseYear THEN 'low' \
                    WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) = m.releaseYear THEN 'correct' \
                    WHEN (SELECT dmy.releaseYear FROM daily_movie_year dmy LIMIT 1) < m.releaseYear THEN 'high' \
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
                WITH guess_tags AS ( \
                    SELECT ts.tagID, ts.score \
                    FROM tagScores ts \
                    JOIN guesses g ON ts.mlID = g.mlID \
                    WHERE g.challengeDate = CURDATE() \
                    AND ts.score > 0.5 \
                    AND g.userCookie = ? \
                    AND g.guessNumber = (SELECT COUNT(gs.guessNumber) FROM guesses gs WHERE gs.challengeDate = CURDATE() AND userCookie = ?) \
                ), \
                motd_tags AS ( \
                  SELECT ts.tagID \
                  FROM dailyMovies dm \
                  JOIN tmdbPopularMovies tp ON dm.selectID = tp.selectID \
                  JOIN idLinks idl ON tp.tmdbID = idl.tmdbID \
                  JOIN tagScores ts ON idl.mlID = ts.mlID \
                  WHERE ts.score > 0.5 \
                ) \
                SELECT t.tagTitle \
                FROM tags t \
                JOIN guess_tags gt ON t.tagID = gt.tagID \
                JOIN motd_tags mt ON gt.tagID = mt.tagID \
                ORDER BY gt.score DESC \
                LIMIT 3; \
                \
                \
                \
                WITH guessed_movie AS ( \
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
                SELECT DISTINCT il.imdbID \
                FROM imdbActors ia \
                JOIN idLinks il ON ia.imdbID = il.imdbID\
                WHERE ia.actorID IN (SELECT actorID FROM today_actors)\
                ),\
                actors_acted_with_today_movie_actors AS (\
                SELECT DISTINCT ia.actorID \
                FROM imdbActors ia \
                WHERE ia.imdbID IN (SELECT imdbID FROM all_today_actor_movies)\
                )\
                SELECT ga.actorName, \
                ga.actorID, \
                CASE \
                  WHEN ga.actorID IN (SELECT actorID FROM today_actors) THEN 'same'\
                  WHEN ga.actorID IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'adjacent'\
                  WHEN ga.actorID NOT IN (SELECT actorID FROM today_actors) AND ga.actorID NOT IN (SELECT actorID FROM actors_acted_with_today_movie_actors) THEN 'no'\
                END AS proximity \
                FROM guessed_movie_actors ga;"
                
                mysqlConnection.query(sql, [body.userID, body.userID, body.userID, body.userID, body.userID, body.userID, body.userID, body.userID], (err___, results___, fields___) => {
                  if (err___) {
                    console.error('Error executing query:', err___);
                    return;
                  }
                  let response = results___[0][0];
                  response['tags'] = results___[1].map(e => e.tagTitle);
                  response['casts'] = results___[2];
                  response['genres'] = response['genres'].split(', ');
                  response['isCorrect'] = results__[0]['isCorrect']==1
                  res.send(response);
                });
              });
            } else {
              console.log(err_);
            }
          });
        }
      } else {
        console.log(err);
      }
    }
  );
});

// Router.post("/", (req, res) => {
//   let qb = req.body;
//   const sql =
//     "SET @ID = ?;SET @Name = ?;SET @Position = ?;SET @Team = ?;SET @OpposingTeam = ?;SET @JodySmith = ?;SET @EricMoody = ?;SET @JohnFerguson = ?;SET @FantasyData = ?; CALL Add_or_Update_QB(@ID, @Name, @Position, @Team, @OpposingTeam, @JodySmith, @EricMoody, @JohnFerguson, @FantasyData);";
//   mysqlConnection.query(
//     sql,
//     [
//       qb.ID,
//       qb.Name,
//       qb.Position,
//       qb.Team,
//       qb.OpposingTeam,
//       qb.JodySmith,
//       qb.EricMoody,
//       qb.JohnFerguson,
//       qb.FantasyData,
//     ],
//     (err, results, fields) => {
//       if (!err) {
//         results.forEach((element) => {
//           if (element.constructor == Array) res.send(element);
//         });
//       } else {
//         console.log(err);
//       }
//     }
//   );
// });

// Router.put("/", (req, res) => {
//   let qb = req.body;
//   const sql =
//     "SET @ID = ?;SET @Name = ?;SET @Position = ?;SET @Team = ?;SET @OpposingTeam = ?;SET @JodySmith = ?;SET @EricMoody = ?;SET @JohnFerguson = ?;SET @FantasyData = ?; CALL Add_or_Update_QB(@ID, @Name, @Position, @Team, @OpposingTeam, @JodySmith, @EricMoody, @JohnFerguson, @FantasyData);";
//   mysqlConnection.query(
//     sql,
//     [
//       qb.ID,
//       qb.Name,
//       qb.Position,
//       qb.Team,
//       qb.OpposingTeam,
//       qb.JodySmith,
//       qb.EricMoody,
//       qb.JohnFerguson,
//       qb.FantasyData,
//     ],
//     (err, results, fields) => {
//       if (!err) {
//         res.send(
//           "The data for the selected quarterback has been successfully updated."
//         );
//       } else {
//         console.log(err);
//       }
//     }
//   );
// });

// Router.delete("/:id", (req, res) => {
//   mysqlConnection.query(
//     "DELETE FROM quarterback_rankings WHERE ID= ? ",
//     [req.params.id],
//     (err, results, fields) => {
//       if (!err) {
//         res.send("The selected quarterback has been successfully deleted.");
//       } else {
//         console.log(err);
//       }
//     }
//   );
// });

module.exports = Router;