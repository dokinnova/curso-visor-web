
import { Resource } from '@/types/scorm';

export function parseResources(doc: Document): Resource[] {
  console.log('=== PARSING SCORM 1.2 RESOURCES ===');
  
  const resources: Resource[] = [];
  const resourceElements = doc.querySelectorAll('resources resource');

  console.log(`Found ${resourceElements.length} resource elements`);

  resourceElements.forEach((resourceElement, index) => {
    const identifier = resourceElement.getAttribute('identifier') || `res-${index}`;
    const type = resourceElement.getAttribute('type') || 'webcontent';
    const href = resourceElement.getAttribute('href') || '';
    const adlcp_scormtype = resourceElement.getAttribute('adlcp:scormtype') || '';

    console.log(`Resource ${index + 1}:`);
    console.log(`  - ID: ${identifier}`);
    console.log(`  - Type: ${type}`);
    console.log(`  - SCORM Type: ${adlcp_scormtype}`);
    console.log(`  - Href: ${href}`);

    // Collect resource files
    const files: string[] = [];
    const fileElements = resourceElement.querySelectorAll('file');
    
    fileElements.forEach(fileElement => {
      const filehref = fileElement.getAttribute('href');
      if (filehref) {
        files.push(filehref);
        console.log(`    - File: ${filehref}`);
      }
    });

    // If no main href but there are files, try to determine main file
    let resolvedHref = href;
    if (!resolvedHref && files.length > 0) {
      resolvedHref = findMainFile(files);
      console.log(`  - Auto-resolved href: ${resolvedHref}`);
    }

    resources.push({
      identifier,
      type,
      href: resolvedHref,
      files
    });
  });

  console.log('=== RESOURCES PARSING COMPLETE ===');
  return resources;
}

function findMainFile(files: string[]): string {
  // Priority of common files in SCORM 1.2
  const commonEntryPoints = [
    'index.html',
    'index.htm',
    'default.html',
    'default.htm',
    'main.html',
    'main.htm',
    'start.html',
    'start.htm',
    'launch.html',
    'launch.htm',
    'content.html',
    'content.htm',
    'lesson.html',
    'lesson.htm'
  ];

  // Look for common entry point files
  for (const entryPoint of commonEntryPoints) {
    const found = files.find(file => 
      file.toLowerCase().endsWith(entryPoint.toLowerCase()) ||
      file.toLowerCase() === entryPoint.toLowerCase()
    );
    if (found) {
      console.log(`Main file detected: ${found}`);
      return found;
    }
  }

  // If none found, use first HTML file
  const htmlFile = files.find(file => 
    file.toLowerCase().endsWith('.html') || 
    file.toLowerCase().endsWith('.htm')
  );
  
  if (htmlFile) {
    console.log(`Using first HTML file: ${htmlFile}`);
    return htmlFile;
  }

  // As last resort, use first file
  return files[0] || '';
}
