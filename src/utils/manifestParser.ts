
import { SCORMManifest } from '@/types/scorm';
import { parseXMLDocument, findManifestElement, extractMetadata, validateSCORM12 } from './xmlUtils';
import { parseOrganizations } from './organizationParser';
import { parseResources } from './resourceParser';

export function parseManifest(xmlString: string): SCORMManifest {
  console.log('=== PARSEANDO MANIFIESTO SCORM 1.2 - INICIO ===');
  
  const doc = parseXMLDocument(xmlString);
  validateSCORM12(doc);
  
  const manifestElement = findManifestElement(doc);

  const identifier = manifestElement.getAttribute('identifier') || 'unknown';
  const version = manifestElement.getAttribute('version') || '1.2';
  
  console.log('Manifest identifier:', identifier);
  console.log('Manifest version:', version);

  // Obtener metadatos mejorados para SCORM 1.2
  const { title, description } = extractMetadata(doc);

  // Parsear organizaciones con estrategias específicas para SCORM 1.2
  const organizations = parseOrganizations(doc);
  logOrganizations(organizations);
  
  // Parsear recursos con detección mejorada
  const resources = parseResources(doc);
  logResources(resources);

  const result = {
    identifier,
    version,
    title,
    description,
    organizations,
    resources
  };

  console.log('=== RESULTADO FINAL DEL PARSING SCORM 1.2 ===');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

function logOrganizations(organizations: any[]) {
  console.log('=== ORGANIZACIONES PARSEADAS ===');
  console.log('Número de organizaciones encontradas:', organizations.length);
  
  organizations.forEach((org, index) => {
    console.log(`Organización ${index + 1}:`);
    console.log(`  - ID: ${org.identifier}`);
    console.log(`  - Título: ${org.title}`);
    console.log(`  - Items: ${org.items.length}`);
    
    org.items.forEach((item: any, itemIndex: number) => {
      console.log(`    Item ${itemIndex + 1}: ${item.title} (ID: ${item.identifier}, Ref: ${item.identifierref || 'sin referencia'})`);
      
      if (item.children && item.children.length > 0) {
        item.children.forEach((child: any, childIndex: number) => {
          console.log(`      Subitem ${childIndex + 1}: ${child.title} (ID: ${child.identifier}, Ref: ${child.identifierref || 'sin referencia'})`);
        });
      }
    });
  });
}

function logResources(resources: any[]) {
  console.log('=== RECURSOS PARSEADOS ===');
  console.log('Número de recursos encontrados:', resources.length);
  
  resources.forEach((res, index) => {
    console.log(`Recurso ${index + 1}:`);
    console.log(`  - ID: ${res.identifier}`);
    console.log(`  - Tipo: ${res.type}`);
    console.log(`  - Href: ${res.href || 'sin href principal'}`);
    console.log(`  - Archivos (${res.files.length}): ${res.files.join(', ')}`);
  });
}
