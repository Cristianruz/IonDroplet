const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'iondroplet',
  user: 'postgres',
  password: 'CristianCruz'
});

async function initDB() {
  try {
    console.log("Intentando conectar a PostgreSQL...");
    const client = await pool.connect();
    console.log("¡Conexión exitosa!");
    
    // Crear tabla sensor_readings
    await client.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        voltage DECIMAL(5,2),
        current DECIMAL(5,2),
        device_id VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabla 'sensor_readings' verificada/creada.");

    // Crear tabla thresholds
    await client.query(`
      CREATE TABLE IF NOT EXISTS thresholds (
        id SERIAL PRIMARY KEY,
        temp_max DECIMAL(5,2),
        hum_max DECIMAL(5,2),
        volt_min DECIMAL(5,2),
        volt_max DECIMAL(5,2),
        curr_max DECIMAL(5,2)
      );
    `);
    console.log("Tabla 'thresholds' verificada/creada.");

    client.release();
    console.log("Todo inicializado correctamente.");
    process.exit(0);
  } catch (err) {
    console.error("ERROR CRÍTICO AL CONECTAR A LA BASE DE DATOS:", err);
    process.exit(1);
  }
}

initDB();
