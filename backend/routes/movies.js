const express = require("express");
const mysqlConnection = require("../utils/database");

const Router = express.Router();

const MAX_MOVIES_TO_CHOOSE_FROM = 1000;
const MAX_GUESSES = 10;
const MAX_SEARCH_RETURN = 10;

function movieDetails(userID) {
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
  ), \
  join_tables AS ( \
    SELECT gt.tagID, gt.score \
    FROM guess_tags gt \
    JOIN motd_tags mt ON gt.tagID = mt.tagID \
    ORDER BY gt.score DESC \
    LIMIT 3 \
  ) \
  SELECT GROUP_CONCAT(DISTINCT t.tagTitle ORDER BY t.tagTitle SEPARATOR ', ') AS tags \
  FROM tags t \
  JOIN join_tables jt ON t.tagID = jt.tagID;"

  mysqlConnection.query(sql, [userID, userID, userID, userID, userID, userID, userID], (err, results, fields) => {
    if (err) {
      console.error('Error executing query:', err);
      return;
    }
    console.log('Query results:', results);
  });
}

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

Router.post("/makeGuess", (req, res) => {
  let body = req.body;
  let sql = "SELECT COUNT(*) totalGuesses FROM guesses WHERE challengeDate=CURDATE() AND userCookie=?;";
  mysqlConnection.query(sql, [body.userID],
    (err, results, fields) => {
      if (!err) {
        if (results[0]['totalGuesses'] >= MAX_GUESSES) {
          res.send({'result': 'FAILED'})
          return; // I think this will short circuit out and not run next sql query?
        }
      } else {
        console.log(err);
      }
    }
  );

  sql = "INSERT INTO guesses VALUES (CURDATE(), ?, (SELECT mgn FROM (SELECT COUNT(*)+1 mgn FROM guesses WHERE userCookie=? AND challengeDate=CURDATE()) t), ?)";
  mysqlConnection.query(sql, [body.userID, body.userID, body.guessMLID],
    (err, results, fields) => {
      if (!err) {
        console.log("success")
        // TODO: check to see if guess was right and return information for help if not
        movieDetails(body.userID);
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