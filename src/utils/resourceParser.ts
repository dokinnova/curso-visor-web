
import { Resource } from '@/types/scorm';

export function parseResources(doc: Document): Resource[] {
  console.log('=== PARSEANDO RECURSOS SCORM 1.2 ===');
  
  const resources: Resource[] = [];
  const resourceElements = doc.querySelectorAll('resources resource');

  console.log(`Encontrados ${resourceElements.length} elementos resource`);

  resourceElements.forEach((resourceElement, index) => {
    const identifier = resourceElement.getAttribute('identifier') || `res-${index}`;
    const type = resourceElement.getAttribute('type') || 'webcontent';
    const href = resourceElement.getAttribute('href') || '';
    const adlcp_scormtype = resourceElement.getAttribute('adlcp:scormtype') || '';

    console.log(`Recurso ${index + 1}:`);
    console.log(`  - ID: ${identifier}`);
    console.log(`  - Tipo: ${type}`);
    console.log(`  - SCORM Type: ${adlcp_scormtype}`);
    console.log(`  - Href: ${href}`);

    // Recopilar archivos del recurso
    const files: string[] = [];
    const fileElements = resourceElement.querySelectorAll('file');
    
    fileElements.forEach(fileElement => {
      const filehref = fileElement.getAttribute('href');
      if (filehref) {
        files.push(filehref);
        console.log(`    - Archivo: ${filehref}`);
      }
    });

    // Si no hay href principal pero hay archivos, intentar determinar el archivo principal
    let resolvedHref = href;
    if (!resolvedHref && files.length > 0) {
      resolvedHref = findMainFile(files);
      console.log(`  - Href resuelto automáticamente: ${resolvedHref}`);
    }

    resources.push({
      identifier,
      type,
      href: resolvedHref,
      files
    });
  });

  console.log('=== RECURSOS PARSEADOS COMPLETAMENTE ===');
  return resources;
}

function findMainFile(files: string[]): string {
  // Prioridad de archivos comunes en SCORM 1.2
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

  // Buscar archivos de entrada comunes
  for (const entryPoint of commonEntryPoints) {
    const found = files.find(file => 
      file.toLowerCase().endsWith(entryPoint.toLowerCase()) ||
      file.toLowerCase() === entryPoint.toLowerCase()
    );
    if (found) {
      console.log(`Archivo principal detectado: ${found}`);
      return found;
    }
  }

  // Si no encuentra ninguno común, usar el primer archivo HTML
  const htmlFile = files.find(file => 
    file.toLowerCase().endsWith('.html') || 
    file.toLowerCase().endsWith('.htm')
  );
  
  if (htmlFile) {
    console.log(`Usando primer archivo HTML: ${htmlFile}`);
    return htmlFile;
  }

  // Como último recurso, usar el primer archivo
  return files[0] || '';
}
