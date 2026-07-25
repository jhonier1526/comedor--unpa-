// components/AdminView.jsx
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const API = 'https://comedor-unpa-production.up.railway.app';

export default function AdminView({ onLogout }) {
  const { turnos, actualizarEstado } = useApp();

  const pendientes  = turnos.filter(t => t.estado === 'pendiente');
  const enProceso   = turnos.filter(t => t.estado === 'en proceso');
  const completados = turnos.filter(t => t.estado === 'completado');

  // ─── Panel de horarios ──────────────────────────────────────────────────────
  const [horarios, setHorarios] = useState({
    desayuno: { inicio: '07:00', fin: '10:00' },
    almuerzo: { inicio: '11:00', fin: '14:00' },
    cena:     { inicio: '17:00', fin: '20:00' }
  });
  const [guardadoHorarios, setGuardadoHorarios] = useState(false);

  useEffect(() => {
    fetch(`${API}/horarios`)
      .then(r => r.json())
      .then(data => setHorarios(data))
      .catch(err => console.error('Error cargando horarios:', err));
  }, []);

  async function guardarHorarios() {
    await fetch(`${API}/horarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(horarios)
    });
    setGuardadoHorarios(true);
    setTimeout(() => setGuardadoHorarios(false), 2000);
  }

  // ─── Panel de platos ────────────────────────────────────────────────────────
  const platosIniciales = {
    desayuno: [
      { nombre: '', cantidad: 0 },
      { nombre: '', cantidad: 0 },
      { nombre: '', cantidad: 0 }
    ],
    almuerzo: [
      { nombre: '', cantidad: 0 },
      { nombre: '', cantidad: 0 },
      { nombre: '', cantidad: 0 }
    ],
    cena: [
      { nombre: '', cantidad: 0 },
      { nombre: '', cantidad: 0 },
      { nombre: '', cantidad: 0 }
    ]
  };

  const [platos, setPlatos] = useState(platosIniciales);
  const [guardadoPlatos, setGuardadoPlatos] = useState(false);

  useEffect(() => {
    fetch(`${API}/platos`)
      .then(r => r.json())
      .then(data => {
        // Compatibilidad con formato viejo y nuevo
        const nuevo = {};
        ['desayuno', 'almuerzo', 'cena'].forEach(j => {
          if (Array.isArray(data[j])) {
            nuevo[j] = data[j];
          } else {
            nuevo[j] = [
              { nombre: data[j]?.descripcion || '', cantidad: data[j]?.cantidad || 0 },
              { nombre: '', cantidad: 0 },
              { nombre: '', cantidad: 0 }
            ];
          }
        });
        setPlatos(nuevo);
      })
      .catch(err => console.error('Error cargando platos:', err));
  }, []);

  async function guardarPlatos() {
    await fetch(`${API}/platos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(platos)
    });
    setGuardadoPlatos(true);
    setTimeout(() => setGuardadoPlatos(false), 2000);
  }

  // ─── Componente TurnoCard ───────────────────────────────────────────────────
  function TurnoCard({ turno }) {
    return (
      <div style={{
        background: 'var(--blanco)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: 'var(--amarillo)',
            color: 'var(--verde)',
            fontWeight: 900,
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 18
          }}>
            {turno.turno_letra}
          </span>
          <div>
            <p style={{ fontWeight: 600 }}>{turno.nombre}</p>
            <p style={{ fontSize: 12, color: 'var(--texto-claro)' }}>
              {turno.codigo_estudiante} · {turno.jornada} · {turno.hora?.slice(0, 5)}
            </p>
            {turno.plato_elegido && (
              <p style={{ fontSize: 12, color: 'var(--verde)', fontWeight: 600 }}>
                🍴 {turno.plato_elegido}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {turno.estado === 'pendiente' && (
            <button
              onClick={() => actualizarEstado(turno.id, 'en proceso')}
              style={{ background: 'var(--verde)', color: 'var(--blanco)', fontSize: 12, padding: '6px 12px' }}
            >
              Llamar
            </button>
          )}
          {turno.estado === 'en proceso' && (
            <button
              onClick={() => actualizarEstado(turno.id, 'completado')}
              style={{ background: 'var(--amarillo)', color: 'var(--verde)', fontSize: 12, padding: '6px 12px' }}
            >
              Completar
            </button>
          )}
          {turno.estado === 'completado' && (
            <span style={{ fontSize: 12, color: 'var(--texto-claro)' }}>✅ Atendido</span>
          )}
        </div>
      </div>
    );
  }

  // ─── Componente Seccion ─────────────────────────────────────────────────────
  function Seccion({ titulo, lista, color }) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            background: color,
            borderRadius: 20,
            padding: '2px 12px',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--verde)'
          }}>
            {lista.length}
          </span>
          <h3 style={{ color: 'var(--verde)' }}>{titulo}</h3>
        </div>
        {lista.length === 0
          ? <p style={{ color: 'var(--texto-claro)', fontSize: 13 }}>Sin turnos</p>
          : lista.map(t => <TurnoCard key={t.id} turno={t} />)
        }
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gris-claro)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--verde)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: 'var(--amarillo)', fontWeight: 700, fontSize: 20 }}>
          Panel Administrador
        </span>
        <button
          onClick={onLogout}
          style={{ background: 'var(--amarillo)', color: 'var(--verde)', fontSize: 13 }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 16px' }}>

       {/* Panel de platos */}
<div style={{
  background: 'var(--blanco)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 28
}}>
  <h3 style={{ color: 'var(--verde)', marginBottom: 16 }}>🍽️ Platos disponibles</h3>

  {['desayuno', 'almuerzo', 'cena'].map(j => (
    <div key={j} style={{ marginBottom: 24 }}>
      <p style={{
        fontWeight: 700,
        color: 'var(--verde)',
        fontSize: 15,
        marginBottom: 10,
        textTransform: 'capitalize'
      }}>
        {j === 'desayuno' ? '🍳' : j === 'almuerzo' ? '🍽️' : '🌙'} {j}
      </p>

      {platos[j].map((plato, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 10,
          marginBottom: 8,
          alignItems: 'center'
        }}>
          <span style={{
            background: 'var(--amarillo)',
            color: 'var(--verde)',
            fontWeight: 700,
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            minWidth: 24,
            textAlign: 'center'
          }}>
            {i + 1}
          </span>
          <input
            type="text"
            value={plato.nombre}
            onChange={e => {
              const nuevos = [...platos[j]];
              nuevos[i] = { ...nuevos[i], nombre: e.target.value };
              setPlatos(p => ({ ...p, [j]: nuevos }));
            }}
            placeholder={`Opción ${i + 1} (ej: Pollo asado)`}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            value={plato.cantidad}
            onChange={e => {
              const nuevos = [...platos[j]];
              nuevos[i] = { ...nuevos[i], cantidad: Number(e.target.value) };
              setPlatos(p => ({ ...p, [j]: nuevos }));
            }}
            style={{ width: 70 }}
            placeholder="Cant."
          />
          {/* Botón eliminar — solo si hay más de 1 */}
          {platos[j].length > 1 && (
            <button
              onClick={() => {
                const nuevos = platos[j].filter((_, idx) => idx !== i);
                setPlatos(p => ({ ...p, [j]: nuevos }));
              }}
              style={{
                background: '#ffeeee',
                color: '#cc0000',
                border: '1px solid #ffcccc',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Botón agregar plato */}
      <button
        onClick={() => setPlatos(p => ({
          ...p,
          [j]: [...p[j], { nombre: '', cantidad: 0 }]
        }))}
        style={{
          background: 'transparent',
          border: '1px dashed var(--verde)',
          color: 'var(--verde)',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          cursor: 'pointer',
          marginTop: 4,
          width: '100%'
        }}
      >
        + Agregar opción
      </button>
    </div>
  ))}

  <button
    onClick={guardarPlatos}
    style={{
      background: guardadoPlatos ? 'var(--verde-claro)' : 'var(--verde)',
      color: 'var(--blanco)',
      marginTop: 8
    }}
  >
    {guardadoPlatos ? '✅ Guardado' : 'Guardar platos'}
  </button>
</div>

        {/* Panel de horarios */}
        <div style={{
          background: 'var(--blanco)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 28
        }}>
          <h3 style={{ color: 'var(--verde)', marginBottom: 16 }}>⏰ Configurar horarios</h3>

          {['desayuno', 'almuerzo', 'cena'].map(j => (
            <div key={j} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12
            }}>
              <span style={{
                width: 90,
                fontWeight: 600,
                textTransform: 'capitalize',
                color: 'var(--verde)'
              }}>
                {j === 'desayuno' ? '🍳' : j === 'almuerzo' ? '🍽️' : '🌙'} {j}
              </span>
              <input
                type="time"
                value={horarios[j].inicio}
                onChange={e => setHorarios(h => ({
                  ...h, [j]: { ...h[j], inicio: e.target.value }
                }))}
                style={{ width: 120 }}
              />
              <span style={{ color: 'var(--texto-claro)' }}>→</span>
              <input
                type="time"
                value={horarios[j].fin}
                onChange={e => setHorarios(h => ({
                  ...h, [j]: { ...h[j], fin: e.target.value }
                }))}
                style={{ width: 120 }}
              />
            </div>
          ))}

          <button
            onClick={guardarHorarios}
            style={{
              background: guardadoHorarios ? 'var(--verde-claro)' : 'var(--verde)',
              color: 'var(--blanco)',
              marginTop: 8
            }}
          >
            {guardadoHorarios ? '✅ Guardado' : 'Guardar horarios'}
          </button>
        </div>

        {/* Turnos */}
        <Seccion titulo="En proceso"  lista={enProceso}   color="var(--amarillo)" />
        <Seccion titulo="Pendientes"  lista={pendientes}  color="var(--amarillo-claro)" />
        <Seccion titulo="Completados" lista={completados} color="var(--gris)" />

      </div>
    </div>
  );
}