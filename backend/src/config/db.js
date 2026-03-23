const mysql = require('mysql2/promise');

let pool = null;

const createPool = () => {
  try {
    pool = mysql.createPool({
      host:               process.env.DB_HOST,
      port:               parseInt(process.env.DB_PORT) || 3306,
      user:               process.env.DB_USER,
      password:           process.env.DB_PASSWORD,
      database:           process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit:    parseInt(process.env.DB_POOL_LIMIT) || 10,
      queueLimit:         0,
      timezone:           '+00:00',
    });

    console.log('[DB] MySQL connection pool created');
    return pool;
  } catch (err) {
    console.error('[DB] Failed to create connection pool:', err.message);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    return createPool();
  }
  return pool;
};

const testConnection = async () => {
  try {
    const connection = await getPool().getConnection();
    console.log('[DB] Connection test successful');
    connection.release();
  } catch (err) {
    console.error('[DB] Connection test failed:', err.message);
    process.exit(1);
  }
};

module.exports = { getPool, testConnection };
