const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium');

async function consultarFactura(codigo, fecha) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://admin.factura.gob.sv/consultaPublica');
    
    // Llenar el formulario
    await page.type('#codigoGeneracion', codigo);
    await page.type('#fechaEmision', fecha);
    
    // Hacer clic en el botón de consulta
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue la respuesta
    await page.waitForSelector('#resultadoConsulta', { timeout: 5000 });
    
    // Obtener los resultados
    const resultado = await page.evaluate(() => {
      const elemento = document.querySelector('#resultadoConsulta');
      return elemento ? elemento.innerText : 'No se encontraron resultados';
    });
    
    return { resultado };
  } finally {
    await browser.close();
  }
}

module.exports = { consultarFactura };