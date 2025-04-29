const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium-min');

// Configuración optimizada para Railway
chromium.setGraphicsMode = false; // Desactiva gráficos para ahorrar recursos

async function consultarFactura(codigo, fecha) {
  // 1. Configuración del navegador
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--disable-gpu',           // Acelera en entornos sin GPU
      '--disable-dev-shm-usage', // Evita problemas de memoria
      '--no-sandbox',           // Necesario para Railway
      '--single-process'        // Reduce uso de recursos
    ],
    executablePath: await chromium.executablePath(),
    headless: true,             // Modo sin interfaz gráfica
    ignoreHTTPSErrors: true     // Ignora errores de certificado SSL
  });

  try {
    const page = await browser.newPage();
    
    // 2. Configuración de la página
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    await page.setDefaultNavigationTimeout(60000); // 60 segundos de timeout

    // 3. Navegación a la página de consulta
    console.log('Navegando a factura.gob.sv...');
    await page.goto('https://admin.factura.gob.sv/consultaPublica', {
      waitUntil: 'networkidle2', // Espera a que carguen los recursos
      timeout: 30000
    });

    // 4. Llenado del formulario
    console.log('Llenando formulario...');
    await page.type('#codigoGeneracion', codigo, { delay: 50 });
    await page.type('#fechaEmision', fecha, { delay: 50 });

    // 5. Envío del formulario
    console.log('Enviando consulta...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // 6. Espera y captura de resultados
    console.log('Esperando resultados...');
    await page.waitForSelector('#resultadoConsulta', { 
      visible: true,
      timeout: 15000 
    });

    // 7. Extracción del resultado
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
    // 8. Cierre seguro del navegador
    if (browser && browser.process() != null) {
      await browser.close();
      console.log('Navegador cerrado correctamente');
    }
  }
}

module.exports = { consultarFactura };
