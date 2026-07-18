import React, { useState } from 'react';

export default function AdminMenu() {
  const [nombre, setNombre] = useState('almuerzo');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [maxCupos, setMaxCupos] = useState(100);
  const [imagen, setImagen] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FormData es obligatorio cuando se suben archivos
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('fecha', fecha);
    formData.append('max_cupos', maxCupos);
    if (imagen) formData.append('imagen', imagen);

    try {
      const response = await fetch('http://localhost:3000/api/admin/menus', {
        method: 'POST',
        body: formData, // Enviamos el formData directamente
      });

      const data = await response.json();
      if (response.ok) {
        setMensaje('✓ Menú publicado con éxito');
        setDescripcion('');
        setImagen(null);
      } else {
        setMensaje(`Error: ${data.error}`);
      }
    } catch (error) {
      setMensaje('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', padding: '20px' }}>
      <h2>Panel de Administración - Universidad del Pacífico</h2>
      <h3>Crear Menú Disponible</h3>
      
      {mensaje && <p>{mensaje}</p>}

      <form onSubmit={handleSubmit}>
        <label>Tipo de Comida:</label>
        <select value={nombre} onChange={(e) => setNombre(e.target.value)} style={{display:'block', width:'100%', marginBottom:'10px'}}>
          <option value="desayuno">Desayuno</option>
          <option value="almuerzo">Almuerzo</option>
          <option value="cena">Cena</option>
        </select>

        <label>Descripción del Plato:</label>
        <textarea 
          value={descripcion} 
          onChange={(e) => setDescripcion(e.target.value)} 
          placeholder="Ej: Arroz con pollo, ensalada y jugo de lulo"
          style={{display:'block', width:'100%', marginBottom:'10px'}}
          required
        />

        <label>Fecha del Servicio:</label>
        <input 
          type="date" 
          value={fecha} 
          onChange={(e) => setFecha(e.target.value)} 
          style={{display:'block', width:'100%', marginBottom:'10px'}}
          required
        />

        <label>Cantidad de Turnos/Cupos Disponibles:</label>
        <input 
          type="number" 
          value={maxCupos} 
          onChange={(e) => setMaxCupos(e.target.value)} 
          style={{display:'block', width:'100%', marginBottom:'10px'}}
          required
        />

        <label>Foto de la Comida:</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImagen(e.target.files[0])} 
          style={{display:'block', marginBottom:'20px'}}
        />

        <button type="submit" style={{padding:'10px 20px', background:'green', color:'white', border:'none', cursor:'pointer'}}>
          Publicar Menú y Turnos
        </button>
      </form>
    </div>
  );
}