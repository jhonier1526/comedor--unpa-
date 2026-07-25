const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/conf/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── DETECTAR JORNADA SEGÚN LA HORA ──────────────────────────────────────────
async function getJornadaActual() {
  try {
    const { rows } = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'horarios'`
    );
    const horarios = rows[0].valor;
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
  } catch (err) {
    return null;
  }
}

// ─── RUTA PRINCIPAL ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '✅ Servidor del Comedor UNPA funcionando' });
});

// ─── HORARIOS ─────────────────────────────────────────────────────────────────
app.get('/horarios', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'horarios'`
    );
    res.json(rows[0].valor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/horarios', async (req, res) => {
  try {
    const { desayuno, almuerzo, cena } = req.body;
    const { rows } = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'horarios'`
    );
    const actual = rows[0].valor;
    if (desayuno) actual.desayuno = desayuno;
    if (almuerzo) actual.almuerzo = almuerzo;
    if (cena)     actual.cena     = cena;

    await pool.query(
      `UPDATE configuracion SET valor = $1, updated_at = NOW() WHERE clave = 'horarios'`,
      [JSON.stringify(actual)]
    );
    res.json({ ok: true, horarios: actual });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PLATOS ───────────────────────────────────────────────────────────────────
app.get('/platos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'platos'`
    );
    res.json(rows[0].valor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/platos', async (req, res) => {
  try {
    const { desayuno, almuerzo, cena } = req.body;
    const { rows } = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'platos'`
    );
    const actual = rows[0].valor;
    if (desayuno !== undefined) actual.desayuno = desayuno;
    if (almuerzo !== undefined) actual.almuerzo = almuerzo;
    if (cena     !== undefined) actual.cena     = cena;

    await pool.query(
      `UPDATE configuracion SET valor = $1, updated_at = NOW() WHERE clave = 'platos'`,
      [JSON.stringify(actual)]
    );
    res.json({ ok: true, platosDisponibles: actual });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREAR TURNO ──────────────────────────────────────────────────────────────
app.post('/orders', async (req, res) => {
  const { nombre, codigoEstudiante, platoElegido } = req.body;

  if (!nombre || !codigoEstudiante || !platoElegido) {
    return res.status(400).json({ error: 'Faltan campos: nombre, codigoEstudiante, platoElegido' });
  }

  const jornadaActual = await getJornadaActual();
  if (!jornadaActual) {
    return res.status(400).json({ error: 'Fuera de horario de atención.' });
  }

  try {
    // ─── Verificar plato disponible ───────────────────────────────────────
    const { rows: platosRows } = await pool.query(
      `SELECT valor FROM configuracion WHERE clave = 'platos'`
    );
    const platosActuales = platosRows[0].valor;
    const platos = platosActuales[jornadaActual.jornada];
    const platoIndex = platos.findIndex(p => p.nombre === platoElegido);

    if (platoIndex === -1) {
      return res.status(400).json({ error: 'Plato no encontrado.' });
    }
    if (platos[platoIndex].cantidad <= 0) {
      return res.status(400).json({ error: `El plato "${platoElegido}" está agotado.` });
    }

    // ─── Verificar turno duplicado ────────────────────────────────────────
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

    // ─── Generar turno ────────────────────────────────────────────────────
    const { rows: existing } = await pool.query(
      `SELECT COUNT(*) FROM turnos 
       WHERE turno_letra LIKE $1 AND fecha = CURRENT_DATE`,
      [`${jornadaActual.letra}%`]
    );

    const seq = parseInt(existing[0].count) + 1;
    const turno_letra = `${jornadaActual.letra}${seq}`;

    const { rows } = await pool.query(
      `INSERT INTO turnos 
        (numero_turno, nombre, codigo_estudiante, estado, jornada, turno_letra, plato_elegido)
       VALUES ($1, $2, $3, 'pendiente', $4, $5, $6)
       RETURNING *`,
      [seq, nombre, String(codigoEstudiante).slice(0, 8), jornadaActual.jornada, turno_letra, platoElegido]
    );

    // ─── Descontar plato ──────────────────────────────────────────────────
    platosActuales[jornadaActual.jornada][platoIndex].cantidad--;
    await pool.query(
      `UPDATE configuracion SET valor = $1 WHERE clave = 'platos'`,
      [JSON.stringify(platosActuales)]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error:', err.message);
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