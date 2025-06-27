import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'database.gratian.pro',
  user: 'u69_UMFQcDA2ml',
  password: 'f1f33fKYay4u5HIPNb.GQ+J.',
  database: 's69_mkcommunity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exportando como db
export { db };
