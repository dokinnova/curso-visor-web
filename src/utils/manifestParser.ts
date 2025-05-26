
import { SCORMManifest } from '@/types/scorm';
import { parseXMLDocument, findManifestElement, extractMetadata, validateSCORM12 } from './xmlUtils';
import { parseOrganizations } from './organizationParser';
import { parseResources } from './resourceParser';

export function parseManifest(xmlString: string): SCORMManifest {
  console.log('=== PARSING SCORM 1.2 MANIFEST - START ===');
  
  const doc = parseXMLDocument(xmlString);
  validateSCORM12(doc);
  
  const manifestElement = findManifestElement(doc);

  const identifier = manifestElement.getAttribute('identifier') || 'unknown';
  const version = manifestElement.getAttribute('version') || '1.2';
  
  console.log('Manifest identifier:', identifier);
  console.log('Manifest version:', version);

  // Get enhanced metadata for SCORM 1.2
  const { title, description } = extractMetadata(doc);

  // Parse organizations with SCORM 1.2 specific strategies
  const organizations = parseOrganizations(doc);
  logOrganizations(organizations);
  
  // Parse resources with enhanced detection
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

  console.log('=== SCORM 1.2 PARSING FINAL RESULT ===');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

function logOrganizations(organizations: any[]) {
  console.log('=== PARSED ORGANIZATIONS ===');
  console.log('Number of organizations found:', organizations.length);
  
  organizations.forEach((org, index) => {
    console.log(`Organization ${index + 1}:`);
    console.log(`  - ID: ${org.identifier}`);
    console.log(`  - Title: ${org.title}`);
    console.log(`  - Items: ${org.items.length}`);
    
    org.items.forEach((item: any, itemIndex: number) => {
      console.log(`    Item ${itemIndex + 1}: ${item.title} (ID: ${item.identifier}, Ref: ${item.identifierref || 'no reference'})`);
      
      if (item.children && item.children.length > 0) {
        item.children.forEach((child: any, childIndex: number) => {
          console.log(`      Subitem ${childIndex + 1}: ${child.title} (ID: ${child.identifier}, Ref: ${child.identifierref || 'no reference'})`);
        });
      }
    });
  });
}

function logResources(resources: any[]) {
  console.log('=== PARSED RESOURCES ===');
  console.log('Number of resources found:', resources.length);
  
  resources.forEach((res, index) => {
    console.log(`Resource ${index + 1}:`);
    console.log(`  - ID: ${res.identifier}`);
    console.log(`  - Type: ${res.type}`);
    console.log(`  - Href: ${res.href || 'no main href'}`);
    console.log(`  - Files (${res.files.length}): ${res.files.join(', ')}`);
  });
}
