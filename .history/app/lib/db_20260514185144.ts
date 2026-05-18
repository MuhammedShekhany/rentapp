import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "77.237.235.88",
  user: "rent_admin",
  password: "$12$44$48$Mu$",
  database: "rentdb",
  port:3306
});

export default pool;