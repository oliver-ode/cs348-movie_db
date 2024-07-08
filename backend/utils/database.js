const mysql = require("mysql2");

const mysqlConnection = mysql.createConnection({
  host: "localhost",
  user: "movieapp",
  database: "moviedb",
  password: "pass1234",
  multipleStatements: true,
});

mysqlConnection.connect((err) => {
  if (!err) {
    console.log("Connected");
  } else {
      console.log("Connection Failed");
      console.log(err);
  }
});

module.exports = mysqlConnection;