const express = require('express');
const cors = require('cors');
const { consultarFactura } = require('./scraper');

const app = express();

// Configuración CORS para tu frontend
app.use(cors({
  origin: 'https://frront.netlify.app',
  methods: ['POST']
}));

app.use(express.json());

// Ruta principal de consulta
app.post('/api/consulta', async (req, res) => {
  try {
    const { codigo, fecha } = req.body;
    
    if (!codigo || !fecha) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Se requieren código y fecha' 
      });
    }

    const resultado = await consultarFactura(codigo, fecha);
    
    if (!resultado.exito) {
      return res.status(500).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detail: error.message 
    });
  }
});

// Ruta de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor listo en puerto ${PORT}`));
