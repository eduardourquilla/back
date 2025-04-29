const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium-min');

// CORRECCIÓN: esta línea es incorrecta en tu código original
// No existe "chromium.setGraphicsMode = false" (es error de sintaxis y API)
// Así que elimínala completamente.

// Opcional: configura modo headless
chromium.setHeadlessMode = true;  // Esta sí es válida, aunque no estrictamente necesaria.

async function consultarFactura(codigo, fecha) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',           // Acelera en entornos sin GPU
        '--disable-dev-shm-usage', // Evita problemas de memoria
        '--no-sandbox',            // Necesario en Railway
        '--single-process'         // Reduce uso de recursos
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,  // MÁS SEGURO que poner true directo
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    await page.setDefaultNavigationTimeout(60000);

    console.log('Navegando a factura.gob.sv...');
    await page.goto('https://admin.factura.gob.sv/consultaPublica', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Llenando formulario...');
    await page.type('#codigoGeneracion', codigo, { delay: 50 });
    await page.type('#fechaEmision', fecha, { delay: 50 });

    console.log('Enviando consulta...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log('Esperando resultados...');
    await page.waitForSelector('#resultadoConsulta', {
      visible: true,
      timeout: 15000
    });

    const resultado = await page.evaluate(() => {
      const elemento = document.querySelector('#resultadoConsulta');
      return elemento ? elemento.innerText.trim() : 'No se encontraron resultados';
    });

    console.log('Consulta exitosa');
    return {
      exito: true,
      resultado: resultado || 'No se obtuvo respuesta del servidor'
    };

  } catch (error) {
    console.error('Error en la consulta:', error);
    return {
      exito: false,
      error: `Error al consultar: ${error.message}`,
      detalle: error.stack
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador cerrado correctamente');
    }
  }
}

module.exports = { consultarFactura };

