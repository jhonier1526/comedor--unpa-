// context/AppContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { pedirPermiso, enviarNotificacion } from '../notificacion';

const AppContext = createContext();
// direcion ip
const API = 'http://localhost:3000';

export function AppProvider({ children }) {
  const [turnos, setTurnos]   = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const miTurnoRef            = useRef(null);
  const notificadoRef         = useRef({ llamado: false, tres: false, siguiente: false });

  useEffect(() => {
    pedirPermiso();
    cargarTurnos();
    const intervalo = setInterval(cargarTurnos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  async function cargarTurnos() {
    try {
      const res  = await fetch(`${API}/orders`);
      const data = await res.json();
      setTurnos(data);
      verificarAvisos(data);
    } catch (err) {
      console.error('Error cargando turnos:', err);
    }
  }

  function verificarAvisos(data) {
    const miTurno = miTurnoRef.current;
    if (!miTurno) return;

    const pendientes = data.filter(t => t.estado === 'pendiente');
    const enProceso  = data.find(t => t.estado === 'en proceso');
    const antesQueMi = pendientes.filter(t => t.numero_turno < miTurno.numero_turno).length;

    // 1. Admin llamó mi turno
    if (enProceso?.id === miTurno.id && !notificadoRef.current.llamado) {
      enviarNotificacion(
        '¡Te están llamando! 🔔',
        `Tu turno ${miTurno.turno_letra} está siendo atendido. ¡Dirígete al comedor!`
      );
      notificadoRef.current.llamado = true;
    }

    // 2. Faltan 3 turnos
    if (antesQueMi === 3 && !notificadoRef.current.tres) {
      enviarNotificacion(
        'Prepárate 🕐',
        `Faltan solo 3 turnos para el tuyo (${miTurno.turno_letra}). Ve acercándote.`
      );
      notificadoRef.current.tres = true;
    }

    // 3. Eres el siguiente
    if (antesQueMi === 0 && !notificadoRef.current.siguiente && !notificadoRef.current.llamado) {
      enviarNotificacion(
        '¡Eres el siguiente! ⚡',
        `Tu turno ${miTurno.turno_letra} es el próximo. ¡Acércate al comedor!`
      );
      notificadoRef.current.siguiente = true;
    }
  }

  async function tomarTurno(nombre, codigoEstudiante) {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, codigoEstudiante })
    });
    const data = await res.json();

    if (!data.error) {
      miTurnoRef.current  = data;
      notificadoRef.current = { llamado: false, tres: false, siguiente: false };
    }

    await cargarTurnos();
    return data;
  }

  async function actualizarEstado(id, status) {
    await fetch(`${API}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    await cargarTurnos();
  }

  async function loginAdmin(password) {
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.ok) setIsAdmin(true);
    return data.ok;
  }

  function logoutAdmin() { setIsAdmin(false); }

  return (
    <AppContext.Provider value={{
      turnos,
      isAdmin,
      tomarTurno,
      actualizarEstado,
      loginAdmin,
      logoutAdmin,
      cargarTurnos
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}