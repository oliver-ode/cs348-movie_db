const express = require("express");
const mysqlConnection = require("../utils/database");

const Router = express.Router();

const MAX_MOVIES_TO_CHOOSE_FROM = 1000;

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
              if (err_) console.error("Could not insert into dailyMovies")
            }
          );
        }
        else {
          selectID = results[0]['selectID'];
        }
        sql = "SELECT mlTitle FROM tmdbPopularMovies tmdbpm, idLinks idl, mlMoviesWithYears mlmwy WHERE ?=tmdbpm.selectID AND tmdbpm.tmdbID=idl.tmdbID AND idl.mlID=mlmwy.mlID";
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