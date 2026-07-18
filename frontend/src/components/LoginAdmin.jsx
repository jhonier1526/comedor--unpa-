// components/LoginAdmin.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LoginAdmin({ onBack }) {
  const { loginAdmin } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!password) { setError('Ingresa la contraseña.'); return; }
    const ok = await loginAdmin(password);
    if (!ok) setError('Contraseña incorrecta.');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--verde)'
    }}>
      <div style={{
        background: 'var(--blanco)',
        borderRadius: 16,
        padding: 32,
        width: 340
      }}>
        <h2 style={{ color: 'var(--verde)', marginBottom: 8 }}>Panel Admin</h2>
        <p style={{ color: 'var(--texto-claro)', fontSize: 13, marginBottom: 24 }}>
          Comedor UNPA
        </p>

        {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Contraseña de administrador"
          />
        </div>

        <button
          onClick={handleLogin}
          style={{ width: '100%', background: 'var(--verde)', color: 'var(--blanco)', marginBottom: 12 }}
        >
          Ingresar
        </button>

        <button
          onClick={onBack}
          style={{ width: '100%', background: 'var(--gris)', color: 'var(--texto)' }}
        >
          Volver
        </button>
      </div>
    </div>
  );
}