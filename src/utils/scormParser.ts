
import JSZip from 'jszip';
import { SCORMPackage, SCORMManifest, Organization, Item, Resource } from '@/types/scorm';

export async function parseSCORMPackage(file: File): Promise<SCORMPackage> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  
  // Buscar el manifiesto
  const manifestFile = zipContent.file('imsmanifest.xml');
  if (!manifestFile) {
    throw new Error('No se encontró el archivo imsmanifest.xml. Asegúrate de que es un paquete SCORM válido.');
  }

  const manifestXml = await manifestFile.async('text');
  const manifest = parseManifest(manifestXml);

  // Extraer todos los archivos
  const files = new Map<string, File>();
  const filePromises: Promise<void>[] = [];

  zipContent.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      filePromises.push(
        zipEntry.async('blob').then(blob => {
          const file = new File([blob], relativePath, { type: getMimeType(relativePath) });
          files.set(relativePath, file);
        })
      );
    }
  });

  await Promise.all(filePromises);

  return {
    manifest,
    files,
    baseUrl: URL.createObjectURL(file)
  };
}

function parseManifest(xmlString: string): SCORMManifest {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Verificar errores de parsing
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Error al analizar el manifiesto XML: ' + parseError.textContent);
  }

  const manifestElement = doc.querySelector('manifest');
  if (!manifestElement) {
    throw new Error('No se encontró el elemento manifest en el XML');
  }

  const identifier = manifestElement.getAttribute('identifier') || 'unknown';
  const version = manifestElement.getAttribute('version') || '1.0';
  
  // Obtener metadatos
  const titleElement = doc.querySelector('title');
  const title = titleElement?.textContent || 'Curso sin título';
  
  const descriptionElement = doc.querySelector('description');
  const description = descriptionElement?.textContent || undefined;

  // Parsear organizaciones
  const organizations = parseOrganizations(doc);
  
  // Parsear recursos
  const resources = parseResources(doc);

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

  orgElements.forEach(orgElement => {
    const identifier = orgElement.getAttribute('identifier') || 'unknown';
    const titleElement = orgElement.querySelector('title');
    const title = titleElement?.textContent || 'Organización sin título';

    const items = parseItems(orgElement);

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

  itemElements.forEach(itemElement => {
    const identifier = itemElement.getAttribute('identifier') || 'unknown';
    const identifierref = itemElement.getAttribute('identifierref') || undefined;
    
    const titleElement = itemElement.querySelector(':scope > title');
    const title = titleElement?.textContent || 'Item sin título';

    const children = parseItems(itemElement);

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

  resourceElements.forEach(resourceElement => {
    const identifier = resourceElement.getAttribute('identifier') || 'unknown';
    const type = resourceElement.getAttribute('type') || 'webcontent';
    const href = resourceElement.getAttribute('href') || '';

    const files: string[] = [];
    const fileElements = resourceElement.querySelectorAll('file');
    fileElements.forEach(fileElement => {
      const filehref = fileElement.getAttribute('href');
      if (filehref) {
        files.push(filehref);
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
