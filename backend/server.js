const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/conf/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── HORARIOS configurables por el admin ─────────────────────────────────────
let horarios = {
  desayuno: { inicio: '07:00', fin: '10:00' },
  almuerzo: { inicio: '11:00', fin: '14:00' },
  cena:     { inicio: '17:00', fin: '20:00' }
};

// ─── PLATOS DISPONIBLES ───────────────────────────────────────────────────────
let platosDisponibles = {
  desayuno: { cantidad: 0, descripcion: '' },
  almuerzo: { cantidad: 0, descripcion: '' },
  cena:     { cantidad: 0, descripcion: '' }
};

// ─── DETECTAR JORNADA SEGÚN LA HORA ──────────────────────────────────────────
function getJornadaActual() {
  const ahora = new Date();
  const hhmm = ahora.getHours() * 60 + ahora.getMinutes();

  for (const [jornada, rango] of Object.entries(horarios)) {
    const [ih, im] = rango.inicio.split(':').map(Number);
    const [fh, fm] = rango.fin.split(':').map(Number);
    const inicio = ih * 60 + im;
    const fin    = fh * 60 + fm;
    if (hhmm >= inicio && hhmm <= fin) {
      return { jornada, letra: jornada[0].toUpperCase() };
    }
  }
  return null;
}

// ─── RUTA PRINCIPAL ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '✅ Servidor del Comedor UNPA funcionando' });
});

// ─── HORARIOS ─────────────────────────────────────────────────────────────────
app.get('/horarios', (req, res) => {
  res.json(horarios);
});

app.post('/horarios', (req, res) => {
  const { desayuno, almuerzo, cena } = req.body;
  if (desayuno) horarios.desayuno = desayuno;
  if (almuerzo) horarios.almuerzo = almuerzo;
  if (cena)     horarios.cena     = cena;
  res.json({ ok: true, horarios });
});

// ─── PLATOS ───────────────────────────────────────────────────────────────────
app.get('/platos', (req, res) => {
  res.json(platosDisponibles);
});

app.post('/platos', (req, res) => {
  const { desayuno, almuerzo, cena } = req.body;
  if (desayuno !== undefined) platosDisponibles.desayuno = desayuno;
  if (almuerzo !== undefined) platosDisponibles.almuerzo = almuerzo;
  if (cena     !== undefined) platosDisponibles.cena     = cena;
  res.json({ ok: true, platosDisponibles });
});

// ─── CREAR TURNO ──────────────────────────────────────────────────────────────
app.post('/orders', async (req, res) => {
  const { nombre, codigoEstudiante } = req.body;

  if (!nombre || !codigoEstudiante) {
    return res.status(400).json({ error: 'Faltan campos: nombre, codigoEstudiante' });
  }

  const jornadaActual = getJornadaActual();
  if (!jornadaActual) {
    return res.status(400).json({ error: 'Fuera de horario de atención.' });
  }

  try {
    // ─── Verificar platos disponibles ────────────────────────────────────────
    const platosJornada = platosDisponibles[jornadaActual.jornada].cantidad;
    if (platosJornada <= 0) {
      return res.status(400).json({
        error: `No hay platos disponibles para ${jornadaActual.jornada} de hoy.`
      });
    }

    // ─── Verificar por nombre Y código ───────────────────────────────────────
    const { rows: existente } = await pool.query(
      `SELECT id FROM turnos 
       WHERE codigo_estudiante = $1
       AND nombre = $2
       AND jornada = $3
       AND fecha = CURRENT_DATE
       AND estado != 'completado'`,
      [String(codigoEstudiante).slice(0, 8), nombre, jornadaActual.jornada]
    );

    if (existente.length > 0) {
      return res.status(400).json({
        error: `${nombre} ya tiene un turno activo para ${jornadaActual.jornada} de hoy.`
      });
    }

    // ─── Generar número y letra del turno ────────────────────────────────────
    const { rows: existing } = await pool.query(
      `SELECT COUNT(*) FROM turnos 
       WHERE turno_letra LIKE $1 AND fecha = CURRENT_DATE`,
      [`${jornadaActual.letra}%`]
    );

    const seq = parseInt(existing[0].count) + 1;
    const turno_letra = `${jornadaActual.letra}${seq}`;

    // ─── Insertar turno ───────────────────────────────────────────────────────
    const { rows } = await pool.query(
      `INSERT INTO turnos 
        (numero_turno, nombre, codigo_estudiante, estado, jornada, turno_letra)
       VALUES ($1, $2, $3, 'pendiente', $4, $5)
       RETURNING *`,
      [seq, nombre, String(codigoEstudiante).slice(0, 8), jornadaActual.jornada, turno_letra]
    );

    // ─── Descontar un plato ───────────────────────────────────────────────────
    platosDisponibles[jornadaActual.jornada].cantidad--;

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error al crear turno:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── OBTENER TURNOS ───────────────────────────────────────────────────────────
app.get('/orders', async (req, res) => {
  const { status } = req.query;
  try {
    let query = `SELECT * FROM turnos ORDER BY created_at ASC`;
    let params = [];

    if (status) {
      query = `SELECT * FROM turnos WHERE estado = $1 ORDER BY created_at ASC`;
      params = [status];
    }

    const { rows } = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener turnos:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── ACTUALIZAR ESTADO ────────────────────────────────────────────────────────
app.patch('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE turnos SET estado = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error al actualizar turno:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';
  if (password === ADMIN_PASS) return res.json({ ok: true });
  return res.status(401).json({ ok: false });
});

// ─── ARRANCAR SERVIDOR ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});