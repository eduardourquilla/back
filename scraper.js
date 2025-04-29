const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium-min');

async function consultarFactura(codigo, fecha) {
  let browser;
  try {
    console.log('Iniciando navegador...');

    // Configuración para Railway (usa Chromium-min en producción)
    const executablePath = process.env.NODE_ENV === 'production'
      ? await chromium.executablePath()
      : puppeteer.executablePath();

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--single-process',
        '--disable-setuid-sandbox'
      ],
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      timeout: 60000
    });

    const page = await browser.newPage();

    // Configurar User-Agent y viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    await page.setDefaultNavigationTimeout(60000);

    console.log('Navegando a factura.gob.sv...');
    await page.goto('https://admin.factura.gob.sv/consultaPublica', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Llenando formulario...');
    await page.type('#codigoGeneracion', codigo, { delay: 100 });
    await page.type('#fechaEmision', fecha, { delay: 100 });

    console.log('Enviando consulta...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
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

    console.log('Consulta exitosa:', resultado ? 'Datos encontrados' : 'Sin datos');
    return {
      exito: true,
      resultado: resultado
    };

  } catch (error) {
    console.error('❌ Error en la consulta:', error.message);
    return {
      exito: false,
      error: `Error al consultar: ${error.message}`,
      stack: error.stack
    };
  } finally {
    if (browser) {
      await browser.close().catch(e => console.error('Error cerrando navegador:', e));
    }
  }
}

module.exports = { consultarFactura };
