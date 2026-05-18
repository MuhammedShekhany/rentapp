import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "rent_admin",
  password: "$12$44$48$Mu$",
  database: "rent_db",
  port:3306
});

export default pool;