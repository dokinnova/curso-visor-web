
export function parseXMLDocument(xmlString: string): Document {
  console.log('=== PARSEANDO XML DOCUMENT ===');
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Verificar errores de parsing
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('Error parsing XML:', parseError.textContent);
    throw new Error('Error al analizar el manifiesto XML: ' + parseError.textContent);
  }

  console.log('=== XML PARSEADO CORRECTAMENTE ===');
  console.log('Documento XML:', doc);
  console.log('Root element:', doc.documentElement.tagName);

  return doc;
}

export function findManifestElement(doc: Document): Element {
  const manifestElement = doc.querySelector('manifest');
  if (!manifestElement) {
    console.error('No se encontró elemento manifest');
    console.log('Elementos disponibles en el root:', Array.from(doc.documentElement.children).map(el => el.tagName));
    throw new Error('No se encontró el elemento manifest en el XML');
  }
  return manifestElement;
}

export function extractMetadata(doc: Document): { title: string; description?: string } {
  console.log('=== BUSCANDO METADATOS SCORM 1.2 ===');
  let title = 'Curso sin título';
  let description = undefined;

  // Estrategias múltiples para encontrar el título en SCORM 1.2
  const titleSelectors = [
    'metadata general title langstring',
    'metadata general title',
    'organizations organization title',
    'title',
    '[title]'
  ];

  for (const selector of titleSelectors) {
    const titleElement = doc.querySelector(selector);
    if (titleElement && titleElement.textContent?.trim()) {
      title = titleElement.textContent.trim();
      console.log(`Título encontrado con selector "${selector}":`, title);
      break;
    }
  }

  // Estrategias para encontrar descripción
  const descriptionSelectors = [
    'metadata general description langstring',
    'metadata general description',
    'organizations organization description'
  ];

  for (const selector of descriptionSelectors) {
    const descElement = doc.querySelector(selector);
    if (descElement && descElement.textContent?.trim()) {
      description = descElement.textContent.trim();
      console.log(`Descripción encontrada con selector "${selector}":`, description);
      break;
    }
  }

  console.log('TÍTULO FINAL:', title);
  console.log('DESCRIPCIÓN FINAL:', description);

  return { title, description };
}

export function validateSCORM12(doc: Document): boolean {
  console.log('=== VALIDANDO SCORM 1.2 ===');
  
  const manifestElement = findManifestElement(doc);
  const version = manifestElement.getAttribute('version');
  const schemaversion = manifestElement.getAttribute('schemaversion');
  
  console.log('Version:', version);
  console.log('Schema version:', schemaversion);
  
  // Verificar versión SCORM 1.2
  const isScorm12 = version === '1.2' || schemaversion === '1.2' || 
                   manifestElement.getAttribute('xmlns')?.includes('1.2');
  
  if (!isScorm12) {
    console.warn('Este paquete podría no ser SCORM 1.2');
  } else {
    console.log('Paquete SCORM 1.2 validado correctamente');
  }
  
  return true; // Continuar procesamiento incluso si no es exactamente 1.2
}

export function getMimeType(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'pdf': 'application/pdf',
    'swf': 'application/x-shockwave-flash'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
