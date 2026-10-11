
const mysql = require("mysql2/promise");
require("dotenv").config();
const fs = require("fs");

const pool = mysql.createPool({
host: process.env.DB_HOST,
port: Number(process.env.DB_PORT || 3306),
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME || "travel_tour_db",

ssl: {
ca: fs.readFileSync("/etc/secrets/ca.pem"),
rejectUnauthorized: true
},

waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
});

module.exports = pool;
