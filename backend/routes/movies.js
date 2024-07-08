const express = require("express");
const mysqlConnection = require("../utils/database");

const Router = express.Router();

const MAX_MOVIES_TO_CHOOSE_FROM = 1000;
const MAX_GUESSES = 10;

function movieDetails(userID) {
  sql = "-- Step 1: Retrieve the mlID for the guessed movie using selectID \
  WITH guessed_movie AS ( \
      SELECT g.mlID \
      FROM guesses g \
      WHERE g.challengeDate = CURDATE() \
        AND g.userCookie = ? \
        AND g.guessNumber = ( \
          SELECT mgn  \
          FROM (SELECT COUNT(*) AS mgn  \
                FROM guesses  \
                WHERE userCookie = ?  \
                  AND challengeDate = CURDATE()) AS subquery1 \
      ) \
  ), \
  -- Step 2: Retrieve the tagIDs and tagScores of the guessed movie \
  guess_tags AS ( \
      SELECT ts.tagID, ts.score \
      FROM tagScores ts \
      JOIN guesses g ON ts.mlID = g.mlID \
      WHERE g.challengeDate = CURDATE()  \
        AND g.userCookie = ?  \
        AND g.guessNumber = ( \
          SELECT COUNT(*)  \
          FROM guesses  \
          WHERE userCookie = ?  \
            AND challengeDate = CURDATE() \
      ) \
        AND ts.score > 0.7 \
  ), \
  -- Step 3: Retrieve the tagIDs and tagScores of the movie of the day using selectID \
  motd_tags AS ( \
      SELECT ts.tagID, ts.score \
      FROM tagScores ts \
      JOIN dailyMovies dm ON dm.selectID = ( \
          SELECT t.selectID  \
          FROM dailyMovies d \
          JOIN tmdbPopularMovies t ON d.selectID = t.selectID \
          WHERE d.challengeDate = CURDATE() \
      ) \
      JOIN idLinks il ON il.tmdbID = ( \
          SELECT t.tmdbID  \
          FROM tmdbPopularMovies t \
          WHERE t.selectID = dm.selectID \
      ) \
      WHERE ts.mlID = il.mlID  \
        AND ts.score > 0.7 \
  ), \
  join_tags AS ( \
      SELECT gt.tagID, mt.score \
      FROM guess_tags gt \
      JOIN motd_tags mt ON gt.tagID = mt.tagID \
  ), \
  tagChoose AS ( \
      SELECT t.tagTitle \
      FROM tags t \
      JOIN join_tags jt ON t.tagID = jt.tagID \
      ORDER BY jt.score DESC \
      LIMIT 3 \
  ) \
  -- Step 4: Retrieve the basic information about the guessed movie \
  SELECT \
      0 AS isCorrect, \
      g.guessNumber AS guess, \
      m.mlTitle AS title, \
      '' AS studio, \
      m.releaseYear AS year, \
      GROUP_CONCAT(DISTINCT a.actorName ORDER BY a.actorName SEPARATOR ', ') AS casts, \
      GROUP_CONCAT(DISTINCT ge.genre ORDER BY ge.genre SEPARATOR ', ') AS genres, \
      GROUP_CONCAT(DISTINCT tc.tagTitle ORDER BY tc.tagTitle SEPARATOR ', ') AS tags \
  FROM mlMoviesWithYears m \
  JOIN guessed_movie gm ON m.mlID = gm.mlID \
  JOIN guesses g ON m.mlID = g.mlID \
  LEFT JOIN idLinks i ON m.mlID = i.mlID \
  LEFT JOIN genres ge ON m.mlID = ge.mlID \
  LEFT JOIN imdbActors a ON i.imdbID = a.imdbID \
  JOIN tagChoose tc \
  WHERE g.challengeDate = CURDATE() \
    AND g.userCookie = ? \
  GROUP BY m.mlID, g.guessNumber, m.mlTitle, m.releaseYear;";

  mysqlConnection.query(sql, [userID, userID, userID, userID, userID], (err, results, fields) => {
    console.log(results);
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
  const sql = "SELECT * FROM mlMoviesWithYears WHERE mlTitle LIKE ? LIMIT 5;";
  mysqlConnection.query(sql, ['%'+params.title+'%'],
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