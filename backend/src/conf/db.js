//conxion de la base de datos y postgresql
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.connect()
  .then(() => console.log('u42i✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión:', err));

module.exports = pool;