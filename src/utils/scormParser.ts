import JSZip from 'jszip';
import { SCORMPackage, SCORMManifest, Organization, Item, Resource } from '@/types/scorm';

export async function parseSCORMPackage(file: File): Promise<SCORMPackage> {
  console.log('=== INICIANDO PARSEO DE SCORM ===');
  console.log('Archivo recibido:', file.name, 'Tamaño:', file.size);

  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  
  console.log('=== CONTENIDO DEL ZIP ===');
  zipContent.forEach((relativePath, zipEntry) => {
    console.log(`Archivo en ZIP: ${relativePath} (${zipEntry.dir ? 'directorio' : 'archivo'})`);
  });

  // Buscar el manifiesto
  const manifestFile = zipContent.file('imsmanifest.xml');
  if (!manifestFile) {
    console.error('No se encontró imsmanifest.xml');
    throw new Error('No se encontró el archivo imsmanifest.xml. Asegúrate de que es un paquete SCORM válido.');
  }

  console.log('=== LEYENDO MANIFIESTO ===');
  const manifestXml = await manifestFile.async('text');
  console.log('Contenido del manifiesto XML:');
  console.log(manifestXml);

  const manifest = parseManifest(manifestXml);
  console.log('=== MANIFIESTO PARSEADO ===');
  console.log('Manifest parseado:', JSON.stringify(manifest, null, 2));

  // Extraer todos los archivos
  const files = new Map<string, File>();
  const filePromises: Promise<void>[] = [];

  zipContent.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      filePromises.push(
        zipEntry.async('blob').then(blob => {
          const file = new File([blob], relativePath, { type: getMimeType(relativePath) });
          files.set(relativePath, file);
          console.log(`Archivo extraído: ${relativePath} (${file.size} bytes)`);
        })
      );
    }
  });

  await Promise.all(filePromises);
  console.log(`=== EXTRACCIÓN COMPLETA: ${files.size} archivos ===`);

  return {
    manifest,
    files,
    baseUrl: URL.createObjectURL(file)
  };
}

function parseManifest(xmlString: string): SCORMManifest {
  console.log('=== PARSEANDO MANIFIESTO XML ===');
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Verificar errores de parsing
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    console.error('Error parsing XML:', parseError.textContent);
    throw new Error('Error al analizar el manifiesto XML: ' + parseError.textContent);
  }

  const manifestElement = doc.querySelector('manifest');
  if (!manifestElement) {
    console.error('No se encontró elemento manifest');
    throw new Error('No se encontró el elemento manifest en el XML');
  }

  const identifier = manifestElement.getAttribute('identifier') || 'unknown';
  const version = manifestElement.getAttribute('version') || '1.0';
  
  console.log('Manifest identifier:', identifier);
  console.log('Manifest version:', version);

  // Obtener metadatos
  const titleElement = doc.querySelector('title');
  const title = titleElement?.textContent || 'Curso sin título';
  console.log('Título del curso:', title);
  
  const descriptionElement = doc.querySelector('description');
  const description = descriptionElement?.textContent || undefined;
  console.log('Descripción:', description);

  // Parsear organizaciones
  console.log('=== PARSEANDO ORGANIZACIONES ===');
  const organizations = parseOrganizations(doc);
  console.log('Organizaciones encontradas:', organizations.length);
  organizations.forEach((org, index) => {
    console.log(`Organización ${index + 1}:`, org.title, `(${org.items.length} items)`);
  });
  
  // Parsear recursos
  console.log('=== PARSEANDO RECURSOS ===');
  const resources = parseResources(doc);
  console.log('Recursos encontrados:', resources.length);
  resources.forEach((res, index) => {
    console.log(`Recurso ${index + 1}:`, res.identifier, res.href);
  });

  return {
    identifier,
    version,
    title,
    description,
    organizations,
    resources
  };
}

function parseOrganizations(doc: Document): Organization[] {
  const organizations: Organization[] = [];
  const orgElements = doc.querySelectorAll('organization');

  console.log(`Encontrados ${orgElements.length} elementos organization`);

  orgElements.forEach((orgElement, index) => {
    const identifier = orgElement.getAttribute('identifier') || `org-${index}`;
    const titleElement = orgElement.querySelector('title');
    const title = titleElement?.textContent || `Organización ${index + 1}`;

    console.log(`Procesando organización: ${identifier} - ${title}`);

    const items = parseItems(orgElement);
    console.log(`Items en esta organización: ${items.length}`);

    organizations.push({
      identifier,
      title,
      items
    });
  });

  return organizations;
}

function parseItems(parent: Element): Item[] {
  const items: Item[] = [];
  const itemElements = parent.querySelectorAll(':scope > item');

  console.log(`Encontrados ${itemElements.length} items directos`);

  itemElements.forEach((itemElement, index) => {
    const identifier = itemElement.getAttribute('identifier') || `item-${index}`;
    const identifierref = itemElement.getAttribute('identifierref') || undefined;
    
    const titleElement = itemElement.querySelector(':scope > title');
    const title = titleElement?.textContent || `Item ${index + 1}`;

    console.log(`  Item: ${identifier} - ${title} (ref: ${identifierref})`);

    const children = parseItems(itemElement);
    if (children.length > 0) {
      console.log(`    Tiene ${children.length} sub-items`);
    }

    items.push({
      identifier,
      title,
      identifierref,
      children: children.length > 0 ? children : undefined
    });
  });

  return items;
}

function parseResources(doc: Document): Resource[] {
  const resources: Resource[] = [];
  const resourceElements = doc.querySelectorAll('resource');

  console.log(`Encontrados ${resourceElements.length} elementos resource`);

  resourceElements.forEach((resourceElement, index) => {
    const identifier = resourceElement.getAttribute('identifier') || `res-${index}`;
    const type = resourceElement.getAttribute('type') || 'webcontent';
    const href = resourceElement.getAttribute('href') || '';

    console.log(`  Recurso: ${identifier} - ${href} (tipo: ${type})`);

    const files: string[] = [];
    const fileElements = resourceElement.querySelectorAll('file');
    fileElements.forEach(fileElement => {
      const filehref = fileElement.getAttribute('href');
      if (filehref) {
        files.push(filehref);
        console.log(`    Archivo: ${filehref}`);
      }
    });

    resources.push({
      identifier,
      type,
      href,
      files
    });
  });

  return resources;
}

function getMimeType(filename: string): string {
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
