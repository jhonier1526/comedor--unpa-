// components/StudentView.jsx
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { pedirPermiso } from '../notificacion';

const API = 'https://comedor-unpa-production.up.railway.app';

export default function StudentView({ onAdminClick }) {
  const { turnos, tomarTurno } = useApp();
  const [nombre, setNombre]             = useState('');
  const [codigo, setCodigo]             = useState('');
  const [miTurno, setMiTurno]           = useState(null);
  const [error, setError]               = useState('');
  const [permiso, setPermiso]           = useState(Notification.permission);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [platos, setPlatos]             = useState(null);

  const pendientes = turnos.filter(t => t.estado === 'pendiente');
  const enProceso  = turnos.find(t => t.estado === 'en proceso');

  const antesQueMi = miTurno
    ? pendientes.filter(t => t.numero_turno < miTurno.numero_turno).length
    : 0;

  const hora = new Date().getHours();
  const jornadaLabel =
    hora >= 7  && hora < 10 ? '🍳 Desayuno' :
    hora >= 11 && hora < 14 ? '🍽️ Almuerzo' :
    hora >= 17 && hora < 20 ? '🌙 Cena'     : '⏰ Fuera de horario';

  useEffect(() => {
    fetch(`${API}/platos`)
      .then(r => r.json())
      .then(data => setPlatos(data))
      .catch(err => console.error(err));
  }, []);

  async function handleTomar() {
    if (!nombre || !codigo) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (!aceptoTerminos) {
      setError('Debes aceptar el uso de tus datos para continuar.');
      return;
    }
    setError('');
    const turno = await tomarTurno(nombre, codigo);
    if (turno.error) { setError(turno.error); return; }
    setMiTurno(turno);
    setNombre('');
    setCodigo('');
    setAceptoTerminos(false);
  }

  async function activarNotificaciones() {
    const ok = await pedirPermiso();
    setPermiso(ok ? 'granted' : 'denied');
  }

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
    Comedor UNPA
  </span>

  {/* Logo de comida - botón oculto de admin */}
  <div
    onClick={onAdminClick}
    title="Acceso administrador"
    style={{
      cursor: 'pointer',
      fontSize: 28,
      padding: '4px 8px',
      borderRadius: 8,
      transition: 'background 0.2s',
      userSelect: 'none'
    }}
    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
    onMouseLeave={e => e.target.style.background = 'transparent'}
  >
    🍽️
  </div>
</div>

      {/* Banner notificaciones */}
      {permiso !== 'granted' && (
        <div style={{
          background: 'var(--amarillo)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 13, color: 'var(--verde)', fontWeight: 600 }}>
            🔔 Activa las notificaciones para saber cuándo es tu turno
          </span>
          <button
            onClick={activarNotificaciones}
            style={{ background: 'var(--verde)', color: 'var(--blanco)', fontSize: 12, padding: '6px 12px' }}
          >
            Activar
          </button>
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '32px auto', padding: '0 16px' }}>

        {/* Jornada activa */}
        <div style={{
          background: 'var(--amarillo)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          textAlign: 'center',
          fontWeight: 700,
          color: 'var(--verde)',
          fontSize: 15
        }}>
          {jornadaLabel}
        </div>

        {/* Menú del día */}
        {platos && (
          <div style={{
            background: 'var(--blanco)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20
          }}>
            <h3 style={{ color: 'var(--verde)', marginBottom: 12 }}>📋 Menú del día</h3>
            {['desayuno', 'almuerzo', 'cena'].map((j, i, arr) => (
              <div key={j} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--gris)' : 'none'
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
                    {j === 'desayuno' ? '🍳' : j === 'almuerzo' ? '🍽️' : '🌙'} {j}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--texto-claro)' }}>
                    {platos[j]?.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <span style={{
                  background: platos[j]?.cantidad > 0 ? 'var(--amarillo)' : 'var(--gris)',
                  color: 'var(--verde)',
                  fontWeight: 700,
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 12
                }}>
                  {platos[j]?.cantidad > 0 ? `${platos[j].cantidad} disponibles` : 'Agotado'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Turno en atención */}
        <div style={{
          background: 'var(--verde)',
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
          marginBottom: 20,
          color: 'var(--blanco)'
        }}>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Atendiendo ahora</p>
          <p style={{ fontSize: 56, fontWeight: 900, color: 'var(--amarillo)', lineHeight: 1 }}>
            {enProceso ? enProceso.turno_letra : '—'}
          </p>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            {enProceso ? enProceso.nombre : 'Sin turno activo'}
          </p>
        </div>

        {/* Mi turno asignado */}
        {miTurno && (
          <div style={{
            background: 'var(--blanco)',
            border: '2px solid var(--amarillo)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--verde)', fontWeight: 700 }}>Tu turno</p>
            <p style={{ fontSize: 64, fontWeight: 900, color: 'var(--verde)', lineHeight: 1 }}>
              {miTurno.turno_letra}
            </p>
            <p style={{ fontSize: 13, color: 'var(--texto-claro)', marginTop: 8 }}>
              {antesQueMi === 0
                ? '¡Eres el siguiente! Acércate al comedor.'
                : antesQueMi === 1
                ? 'Hay 1 persona adelante de ti'
                : `Hay ${antesQueMi} personas adelante de ti`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--texto-claro)' }}>Nombre</p>
                <p style={{ fontWeight: 600 }}>{miTurno.nombre}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--texto-claro)' }}>Código</p>
                <p style={{ fontWeight: 600 }}>{miTurno.codigo_estudiante}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--texto-claro)' }}>Jornada</p>
                <p style={{ fontWeight: 600 }}>{miTurno.jornada}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div style={{
          background: 'var(--blanco)',
          borderRadius: 20,
          padding: 32,
          marginBottom: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>

          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'var(--verde)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <span style={{ fontSize: 24 }}>🎟️</span>
            </div>
            <h2 style={{ color: 'var(--verde)', fontSize: 22, marginBottom: 4 }}>
              Tomar turno
            </h2>
            <p style={{ color: 'var(--texto-claro)', fontSize: 13 }}>
              Ingresa tus datos para obtener tu turno
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff0f0',
              border: '1px solid #ffcccc',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#cc0000'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Campo código */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--verde)',
              display: 'block',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              Código estudiantil
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16
              }}>🎓</span>
              <input
                type="text"
                value={codigo}
                onChange={e => {
                  const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                  setCodigo(soloNumeros);
                }}
                placeholder="Ej: 20210001"
                maxLength={8}
                inputMode="numeric"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid var(--gris)',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--verde)'}
                onBlur={e => e.target.style.borderColor = 'var(--gris)'}
              />
            </div>
          </div>

          {/* Campo nombre */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--verde)',
              display: 'block',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              Nombre completo
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16
              }}>👤</span>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid var(--gris)',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--verde)'}
                onBlur={e => e.target.style.borderColor = 'var(--gris)'}
              />
            </div>
          </div>

          {/* Términos */}
          <div style={{
            background: '#f8fdf9',
            border: '1px solid #c8e6c9',
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <input
              type="checkbox"
              id="terminos"
              checked={aceptoTerminos}
              onChange={e => setAceptoTerminos(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--verde)' }}
            />
            <label htmlFor="terminos" style={{
              fontSize: 12,
              color: 'var(--texto-claro)',
              cursor: 'pointer',
              lineHeight: 1.6
            }}>
              Autorizo el uso de mis datos personales (nombre y código estudiantil)
              para la gestión del sistema de turnos del Comedor UNPA, conforme a la
              <strong> Ley 1581 de 2012</strong> de protección de datos personales.
            </label>
          </div>

          {/* Botón */}
          <button
            onClick={handleTomar}
            style={{
              width: '100%',
              padding: '14px',
              background: aceptoTerminos ? 'var(--verde)' : 'var(--gris)',
              color: aceptoTerminos ? 'var(--blanco)' : 'var(--texto-claro)',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: aceptoTerminos ? 'pointer' : 'not-allowed',
              letterSpacing: 0.5
            }}
            onMouseDown={e => { if (aceptoTerminos) e.target.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => e.target.style.transform = 'scale(1)'}
          >
            {aceptoTerminos ? '🎟️ Obtener mi turno' : 'Acepta los términos para continuar'}
          </button>
        </div>

        {/* Cola de espera */}
        <div style={{ background: 'var(--blanco)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h3 style={{ color: 'var(--verde)', marginBottom: 16 }}>Cola de espera</h3>
          {miTurno ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 48, fontWeight: 900, color: 'var(--verde)' }}>
                {antesQueMi}
              </p>
              <p style={{ fontSize: 14, color: 'var(--texto-claro)', marginTop: 8 }}>
                {antesQueMi === 0
                  ? '¡Eres el siguiente! Acércate al comedor.'
                  : antesQueMi === 1
                  ? 'Hay 1 persona adelante de ti'
                  : `Hay ${antesQueMi} personas adelante de ti`}
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--texto-claro)', textAlign: 'center', fontSize: 14 }}>
              Toma un turno para ver tu posición en la cola
            </p>
          )}
        </div>

      </div>
    </div>
  );
}