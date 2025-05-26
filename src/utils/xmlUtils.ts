
export function parseXMLDocument(xmlString: string): Document {
  console.log('=== PARSING XML DOCUMENT ===');
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('Error parsing XML:', parseError.textContent);
    throw new Error('Error al analizar el manifiesto XML: ' + parseError.textContent);
  }

  console.log('=== XML PARSED SUCCESSFULLY ===');
  console.log('XML Document:', doc);
  console.log('Root element:', doc.documentElement.tagName);

  return doc;
}

export function findManifestElement(doc: Document): Element {
  const manifestElement = doc.querySelector('manifest');
  if (!manifestElement) {
    console.error('No manifest element found');
    console.log('Available root elements:', Array.from(doc.documentElement.children).map(el => el.tagName));
    throw new Error('No se encontró el elemento manifest en el XML');
  }
  return manifestElement;
}

export function validateSCORM12(doc: Document): void {
  console.log('=== VALIDATING SCORM 1.2 ===');
  
  const manifestElement = findManifestElement(doc);
  const version = manifestElement.getAttribute('version');
  
  console.log('Detected SCORM version:', version);
  
  // SCORM 1.2 typically has version 1.2 or similar
  if (version && !version.startsWith('1.2')) {
    console.warn(`Warning: Expected SCORM 1.2, found version ${version}`);
  }
  
  // Check for SCORM 1.2 specific elements
  const organizations = doc.querySelector('organizations');
  const resources = doc.querySelector('resources');
  
  if (!organizations) {
    console.warn('Warning: No organizations element found - unusual for SCORM 1.2');
  }
  
  if (!resources) {
    console.warn('Warning: No resources element found - unusual for SCORM 1.2');
  }
  
  console.log('SCORM 1.2 validation completed');
}

export function extractMetadata(doc: Document): { title: string; description?: string } {
  console.log('=== EXTRACTING SCORM 1.2 METADATA ===');
  let title = 'Curso sin título';
  let description = undefined;

  // SCORM 1.2 metadata strategies
  const titleSelectors = [
    'metadata general title langstring',
    'metadata general title',
    'manifest > metadata title',
    'title'
  ];

  for (const selector of titleSelectors) {
    const titleElement = doc.querySelector(selector);
    if (titleElement?.textContent?.trim()) {
      title = titleElement.textContent.trim();
      console.log(`Title found with selector "${selector}":`, title);
      break;
    }
  }

  // Search for description
  const descriptionSelectors = [
    'metadata general description langstring',
    'metadata general description',
    'manifest > metadata description'
  ];

  for (const selector of descriptionSelectors) {
    const descElement = doc.querySelector(selector);
    if (descElement?.textContent?.trim()) {
      description = descElement.textContent.trim();
      console.log(`Description found with selector "${selector}":`, description);
      break;
    }
  }

  console.log('FINAL TITLE:', title);
  console.log('FINAL DESCRIPTION:', description);

  return { title, description };
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
    'pdf': 'application/pdf'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
