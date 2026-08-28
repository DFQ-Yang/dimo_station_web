import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  port: Number(process.env.MYSQL_PORT) || 3306,
  password: process.env.MYSQL_PASSWORD || '<PASSWORD>',
  database: process.env.MYSQL_DATABASE || 'codebuddy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//Test connection
export async function testConnection() {
  pool.getConnection()
    .then(conn => {
      console.log('MySQL connection established successfully');
      conn.release();
    })
    .catch(err => {
      console.error('MySQL connection error:', err.message);
    });
}

export default pool;