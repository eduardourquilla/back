const express = require('express');
const { consultarFactura } = require('./scraper');

const app = express();
app.use(express.json());

app.post('/api/consulta', async (req, res) => {
  try {
    const { codigo, fecha } = req.body;
    const resultado = await consultarFactura(codigo, fecha);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor listo`));