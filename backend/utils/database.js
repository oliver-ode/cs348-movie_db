const mysql = require("mysql2");

const mysqlConnection = mysql.createConnection({
  host: "127.0.0.1", // IPv4 loopback address
  port: 3306,
  user: "movieapp",
  database: "moviedb",
  password: "pass1234",
  multipleStatements: true,
});

mysqlConnection.connect((err) => {
  if (!err) {
    console.log("Connected to MySQL successfully.");
  } else {
    console.error("MySQL connection failed. Error details:");
    console.error("Code:", err.code);
    console.error("Errno:", err.errno);
    console.error("SQLState:", err.sqlState);
    console.error("Fatal:", err.fatal);
  }
});

module.exports = mysqlConnection;
