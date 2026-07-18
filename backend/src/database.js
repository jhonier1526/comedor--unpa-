const path = require('path');
const multer = require('multer');

// 1. Configurar dónde y cómo se guardarán las imágenes
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Guarda la foto con la fecha actual para que el nombre sea único (ej: 17192834-plato.jpg)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 2. Hacer que la carpeta 'uploads' sea pública para que React pueda ver las fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * RUTA DE ADMINISTRADOR: CREAR MENÚ DEL DÍA (Con foto y cupos)
 */
app.post('/api/admin/menus', upload.single('imagen'), async (req, res) => {
  const { nombre, descripcion, fecha, max_cupos } = req.body;
  
  // Si subió foto, guardamos su ruta web. Si no, dejamos una por defecto.
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const nuevoMenu = await pool.query(
      `INSERT INTO menus (nombre, descripcion, fecha, max_cupos, imagen_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nombre, descripcion, fecha, max_cupos || 100, imagen_url]
    );

    res.status(201).json({
      mensaje: 'Menú creado exitosamente por el administrador',
      menu: nuevoMenu.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el menú' });
  }
});