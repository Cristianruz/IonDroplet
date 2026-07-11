const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Estado global para control de riego del ESP32
let espSettings = {
  autoMode: true,
  pumpState: 0,
  espIp: null
};

let db;
let port; // <-- declarado aquí para que las rutas lo puedan usar

(async () => {
  db = await open({
    filename: './iondroplet.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature DECIMAL(5,2),
      humidity DECIMAL(5,2),
      voltage DECIMAL(5,2),
      current DECIMAL(5,2),
      device_id VARCHAR(50),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temp_max DECIMAL(5,2),
      hum_max DECIMAL(5,2),
      volt_min DECIMAL(5,2),
      volt_max DECIMAL(5,2),
      curr_max DECIMAL(5,2)
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255)
    );
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ionization_on BOOLEAN DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS ionization_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id VARCHAR(50),
      state BOOLEAN,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Base de datos SQLite (iondroplet.db) inicializada correctamente.");

  // --- CONFIGURACIÓN DE PUERTO SERIAL ---
  // Se inicializa DESPUÉS de la DB para evitar race condition
  const SERIAL_PORT_NAME = 'COM5';

  try {
    port = new SerialPort({ path: SERIAL_PORT_NAME, baudRate: 115200 })
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

    parser.on('data', async (line) => {
      try {
        const data = JSON.parse(line.trim());
        if (data.humedad !== undefined) {

          console.log(`✅ [USB] Humedad recibida del ESP32: ${data.humedad}%`);

          try {
            await db.run(
              'INSERT INTO sensor_readings (humidity, device_id) VALUES (?, ?)',
              [data.humedad, 'ESP-USB']
            );
          } catch (dbErr) {
            console.error("DB Error on Insert:", dbErr.message);
          }

          if (espSettings.autoMode) {
            let limite = 40;
            try {
              const row = await db.get('SELECT * FROM thresholds ORDER BY id DESC LIMIT 1')
              if (row && row.hum_max) {
                limite = row.hum_max;
              }
            } catch (dbErr) {
              console.error("DB Error on Select threshold:", dbErr.message);
            }

            espSettings.pumpState = (data.humedad < limite) ? 1 : 0;
          }

          port.write(`BOMBA:${espSettings.pumpState}\n`);
        }
      } catch (e) {
        // Ignorar líneas que no sean JSON
      }
    });

    port.on('open', () => {
      console.log(`🔌 [USB] ¡Conectado exitosamente al puerto ${SERIAL_PORT_NAME}! Escuchando al ESP32...`);
    });

    port.on('error', (err) => {
      console.log('❌ Error en puerto serial:', err.message);
    });

  } catch (e) {
    console.log('❌ No se pudo inicializar el puerto serial:', e.message);
  }
  // --------------------------------------

})();

const SECRET = process.env.JWT_SECRET

function authMiddleware(req, res, next) {
  // Desactivado para demostración local
  next()
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email])
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' })
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '24h' })
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body
  try {
    const hash = await bcrypt.hash(password, 10)
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hash]
    )
    res.json({ id: result.lastID, email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/sensors/data', async (req, res) => {
  const { temperature, humidity, voltage, current, device_id } = req.body
  try {
    await db.run(
      'INSERT INTO sensor_readings (temperature, humidity, voltage, current, device_id) VALUES (?, ?, ?, ?, ?)',
      [temperature, humidity, voltage, current, device_id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sensors/latest', authMiddleware, async (req, res) => {
  try {
    const row = await db.get(
      'SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1'
    )
    res.json(row || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sensors/history', authMiddleware, async (req, res) => {
  const hours = req.query.hours || 24
  try {
    const rows = await db.all(
      "SELECT * FROM sensor_readings WHERE timestamp > datetime('now', '-' || ? || ' hours') ORDER BY timestamp ASC",
      [hours]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/ionization/toggle', authMiddleware, async (req, res) => {
  const { state, device_id } = req.body
  try {
    await db.run(
      'INSERT INTO ionization_log (device_id, state) VALUES (?, ?)',
      [device_id || 'global', state]
    )
    if (device_id) {
      await db.run(
        'UPDATE devices SET ionization_on = ? WHERE id = ?',
        [state, device_id]
      )
    }
    res.json({ success: true, state, timestamp: new Date() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/thresholds', authMiddleware, async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM thresholds ORDER BY id DESC LIMIT 1')
    res.json(row || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/thresholds', authMiddleware, async (req, res) => {
  const { temp_max, hum_max, volt_min, volt_max, curr_max } = req.body
  try {
    await db.run('DELETE FROM thresholds')
    await db.run(
      'INSERT INTO thresholds (temp_max, hum_max, volt_min, volt_max, curr_max) VALUES (?, ?, ?, ?, ?)',
      [temp_max, hum_max, volt_min, volt_max, curr_max]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/devices', authMiddleware, async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM devices ORDER BY id ASC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/ai/analyze', authMiddleware, async (req, res) => {
  const { temperature, humidity, voltage, current, ionizationOn, exteriorHumidity } = req.body
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Eres el sistema de control de un ionizador de agua. Analiza estos datos y decide si encender o apagar la ionización.

Datos actuales:
- Temperatura interior: ${temperature}°C
- Humedad interior: ${humidity}%
- Humedad exterior: ${exteriorHumidity}%
- Voltaje: ${voltage}V
- Corriente: ${current}A
- Ionización actualmente: ${ionizationOn ? 'ENCENDIDA' : 'APAGADA'}

Responde SOLO en este formato JSON sin texto adicional:
{"recommendation":"encender|apagar|mantener","reason":"explicación breve en español de máximo 20 palabras","confidence":0-100,"action":true|false}`
        }]
      })
    })
    const data = await response.json()
    const text = data.content[0].text.trim()
    const parsed = JSON.parse(text)
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/esp/data', async (req, res) => {
  const { humedad, bomba, ionizador, device_id, ip } = req.body

  if (ip) {
    espSettings.espIp = ip;
  }

  try {
    await db.run(
      'INSERT INTO sensor_readings (humidity, device_id) VALUES (?, ?)',
      [humedad, device_id || 'ESP-01']
    )

    let commandBomba = espSettings.pumpState;

    if (espSettings.autoMode) {
      const row = await db.get('SELECT * FROM thresholds ORDER BY id DESC LIMIT 1')
      const thresholds = row || { hum_max: 40 }

      let limite = thresholds.hum_max ? thresholds.hum_max : 40;

      if (humedad < limite) {
        commandBomba = 1;
      } else {
        commandBomba = 0;
      }
      espSettings.pumpState = commandBomba;
    }

    res.json({ success: true, auto_mode: espSettings.autoMode, bomba: commandBomba })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/esp/control', async (req, res) => {
  const { bomba, autoMode } = req.body;

  if (autoMode !== undefined) {
    espSettings.autoMode = (autoMode === true || autoMode === 'true' || autoMode === 1);
  }

  if (bomba !== undefined && !espSettings.autoMode) {
    espSettings.pumpState = (bomba === true || bomba === 'true' || bomba === 1) ? 1 : 0;
  }

  if (port && port.isOpen) {
    port.write(`BOMBA:${espSettings.pumpState}\n`);
  }

  if (espSettings.espIp) {
    try {
      const response = await fetch(`http://${espSettings.espIp}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ bomba: espSettings.pumpState })
      });
      await response.text();
    } catch (e) {
      console.log("Aviso: No se pudo contactar al ESP32 directamente:", e.message);
    }
  }

  res.json({ success: true, settings: espSettings });
});

app.get('/api/esp/status', async (req, res) => {
  res.json(espSettings);
})

app.listen(3001, () => {
  console.log('IonDroplet backend corriendo en http://localhost:3001')
})