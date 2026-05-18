import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "$12$44$48$Mu$",
  database: "rentdb",
  port:3306
});

export default pool;