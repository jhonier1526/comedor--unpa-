
 
CREATE TABLE estudiante (
  id SERIAL PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  codigo_estudiantil VARCHAR(8) UNIQUE NOT NULL,
  rol VARCHAR(20) DEFAULT 'estudiante',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)


-- Tabla de menús
 CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL, -- 'desayuno', 'almuerzo', 'cena'
  descripcion TEXT,
  disponible BOOLEAN DEFAULT true,
  fecha DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de turnos
CREATE TABLE turnos (
  id SERIAL PRIMARY KEY,
  numero_turno INT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  disponible BOOLEAN DEFAULT true
);

-- Tabla de pedidos
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  menu_id INT REFERENCES menus(id),
  turno_id INT REFERENCES turnos(id),
  estado VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de códigos QR
CREATE TABLE codigos_qr (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  pedido_id INT REFERENCES pedidos(id),
  codigo VARCHAR(255) UNIQUE NOT NULL,
  usado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


