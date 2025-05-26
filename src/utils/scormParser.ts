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
  console.log('Contenido COMPLETO del manifiesto XML:');
  console.log(manifestXml);

  const manifest = parseManifest(manifestXml);
  console.log('=== MANIFIESTO PARSEADO COMPLETO ===');
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
  console.log('=== PARSEANDO MANIFIESTO XML - INICIO ===');
  
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

  const manifestElement = doc.querySelector('manifest');
  if (!manifestElement) {
    console.error('No se encontró elemento manifest');
    console.log('Elementos disponibles en el root:', Array.from(doc.documentElement.children).map(el => el.tagName));
    throw new Error('No se encontró el elemento manifest en el XML');
  }

  const identifier = manifestElement.getAttribute('identifier') || 'unknown';
  const version = manifestElement.getAttribute('version') || '1.0';
  
  console.log('Manifest identifier:', identifier);
  console.log('Manifest version:', version);

  // Obtener metadatos - Buscar en múltiples ubicaciones posibles
  console.log('=== BUSCANDO METADATOS ===');
  let title = 'Curso sin título';
  let description = undefined;

  // Buscar título en metadata/general/title
  const metadataTitle = doc.querySelector('metadata general title langstring');
  if (metadataTitle) {
    title = metadataTitle.textContent || title;
    console.log('Título encontrado en metadata:', title);
  } else {
    // Buscar en otras ubicaciones
    const titleElement = doc.querySelector('title');
    if (titleElement) {
      title = titleElement.textContent || title;
      console.log('Título encontrado en elemento title:', title);
    }
  }

  // Buscar descripción
  const metadataDescription = doc.querySelector('metadata general description langstring');
  if (metadataDescription) {
    description = metadataDescription.textContent;
    console.log('Descripción encontrada:', description);
  }

  console.log('TÍTULO FINAL:', title);
  console.log('DESCRIPCIÓN FINAL:', description);

  // Parsear organizaciones
  console.log('=== PARSEANDO ORGANIZACIONES - INICIO ===');
  const organizations = parseOrganizations(doc);
  console.log('=== ORGANIZACIONES PARSEADAS ===');
  console.log('Número de organizaciones encontradas:', organizations.length);
  organizations.forEach((org, index) => {
    console.log(`Organización ${index + 1}:`);
    console.log(`  - ID: ${org.identifier}`);
    console.log(`  - Título: ${org.title}`);
    console.log(`  - Items: ${org.items.length}`);
    org.items.forEach((item, itemIndex) => {
      console.log(`    Item ${itemIndex + 1}: ${item.title} (ID: ${item.identifier}, Ref: ${item.identifierref})`);
    });
  });
  
  // Parsear recursos
  console.log('=== PARSEANDO RECURSOS - INICIO ===');
  const resources = parseResources(doc);
  console.log('=== RECURSOS PARSEADOS ===');
  console.log('Número de recursos encontrados:', resources.length);
  resources.forEach((res, index) => {
    console.log(`Recurso ${index + 1}:`);
    console.log(`  - ID: ${res.identifier}`);
    console.log(`  - Tipo: ${res.type}`);
    console.log(`  - Href: ${res.href}`);
    console.log(`  - Archivos: ${res.files.join(', ')}`);
  });

  const result = {
    identifier,
    version,
    title,
    description,
    organizations,
    resources
  };

  console.log('=== RESULTADO FINAL DEL PARSING ===');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

function parseOrganizations(doc: Document): Organization[] {
  console.log('=== PARSEANDO ORGANIZACIONES DETALLADO ===');
  
  const organizations: Organization[] = [];
  
  // Buscar el contenedor de organizaciones
  const organizationsContainer = doc.querySelector('organizations');
  if (!organizationsContainer) {
    console.error('No se encontró contenedor organizations');
    return [];
  }

  console.log('Contenedor organizations encontrado');
  
  // Buscar todos los elementos organization
  const orgElements = organizationsContainer.querySelectorAll('organization');
  console.log(`Encontrados ${orgElements.length} elementos organization`);

  if (orgElements.length === 0) {
    console.warn('No se encontraron elementos organization dentro del contenedor');
    // Mostrar el contenido del contenedor para debug
    console.log('Contenido del contenedor organizations:', organizationsContainer.innerHTML);
  }

  orgElements.forEach((orgElement, index) => {
    console.log(`=== PROCESANDO ORGANIZACIÓN ${index + 1} ===`);
    
    const identifier = orgElement.getAttribute('identifier') || `org-${index}`;
    console.log('Organization identifier:', identifier);
    
    // Buscar título de la organización
    const titleElement = orgElement.querySelector('title');
    const title = titleElement?.textContent || `Organización ${index + 1}`;
    console.log('Organization title:', title);

    console.log('Contenido completo de la organización:', orgElement.innerHTML);

    // Parsear items de esta organización
    const items = parseItems(orgElement);
    console.log(`Items parseados para esta organización: ${items.length}`);

    organizations.push({
      identifier,
      title,
      items
    });
  });

  console.log('=== FIN PARSING ORGANIZACIONES ===');
  return organizations;
}

function parseItems(parent: Element): Item[] {
  console.log('=== PARSEANDO ITEMS ===');
  console.log('Elemento padre:', parent.tagName);
  
  const items: Item[] = [];
  
  // Buscar items directos (no nested)
  const itemElements = parent.querySelectorAll(':scope > item');
  console.log(`Encontrados ${itemElements.length} items directos en ${parent.tagName}`);

  if (itemElements.length === 0) {
    console.warn('No se encontraron items directos');
    // Buscar items sin :scope como fallback
    const allItems = parent.querySelectorAll('item');
    console.log(`Fallback: encontrados ${allItems.length} items totales`);
    
    // Mostrar el contenido para debug
    console.log('Contenido del elemento padre:', parent.innerHTML);
  }

  itemElements.forEach((itemElement, index) => {
    console.log(`--- Procesando item ${index + 1} ---`);
    
    const identifier = itemElement.getAttribute('identifier') || `item-${index}`;
    const identifierref = itemElement.getAttribute('identifierref') || undefined;
    
    console.log('Item identifier:', identifier);
    console.log('Item identifierref:', identifierref);
    
    // Buscar título del item
    const titleElement = itemElement.querySelector(':scope > title');
    const title = titleElement?.textContent || `Item ${index + 1}`;
    console.log('Item title:', title);

    // Buscar items hijos
    const children = parseItems(itemElement);
    if (children.length > 0) {
      console.log(`Item tiene ${children.length} sub-items`);
    }

    const item = {
      identifier,
      title,
      identifierref,
      children: children.length > 0 ? children : undefined
    };

    console.log('Item completo:', item);
    items.push(item);
  });

  console.log('=== FIN PARSING ITEMS ===');
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
