
export interface RewriteContext {
  getFileUrl: (path: string) => string | null;
  basePath: string;
}

export function rewriteHtmlContent(htmlContent: string, context: RewriteContext): string {
  console.log('===== HTML REWRITER START =====');
  console.log('Base path:', context.basePath);
  console.log('Original HTML length:', htmlContent.length);
  
  let modifiedHtml = htmlContent;
  
  // Patrones para encontrar referencias a recursos
  const patterns = [
    { regex: /href\s*=\s*["']([^"']+)["']/gi, type: 'href' },
    { regex: /src\s*=\s*["']([^"']+)["']/gi, type: 'src' },
    { regex: /action\s*=\s*["']([^"']+)["']/gi, type: 'action' },
    { regex: /background\s*=\s*["']([^"']+)["']/gi, type: 'background' }
  ];

  let totalReplacements = 0;
  const replacementLog: Array<{type: string, original: string, resolved: string, blobUrl: string | null}> = [];

  patterns.forEach(pattern => {
    let match;
    const replacements: Array<{ original: string; replacement: string }> = [];

    // Reset regex index
    pattern.regex.lastIndex = 0;
    
    while ((match = pattern.regex.exec(htmlContent)) !== null) {
      const originalUrl = match[1];
      
      console.log(`===== PROCESSING ${pattern.type.toUpperCase()}: "${originalUrl}" =====`);
      
      // Skip si es una URL absoluta o data URL
      if (isAbsoluteUrl(originalUrl) || originalUrl.startsWith('data:') || originalUrl.startsWith('#')) {
        console.log(`Skipping absolute/data/fragment URL: ${originalUrl}`);
        continue;
      }

      // Limpiar la URL de parámetros y fragmentos
      const cleanUrl = cleanUrlPath(originalUrl);
      console.log(`Cleaned URL: "${cleanUrl}"`);

      // Resolver la ruta relativa
      const resolvedPath = resolveRelativePath(cleanUrl, context.basePath);
      console.log(`Resolved path: "${resolvedPath}"`);
      
      const blobUrl = context.getFileUrl(resolvedPath);
      console.log(`Blob URL result: ${blobUrl || 'NOT FOUND'}`);
      
      // Log para diagnóstico
      replacementLog.push({
        type: pattern.type,
        original: originalUrl,
        resolved: resolvedPath,
        blobUrl: blobUrl
      });
      
      if (blobUrl) {
        // Validar que la URL blob es válida
        try {
          new URL(blobUrl);
          console.log(`✓ Valid blob URL: ${blobUrl}`);
          
          replacements.push({
            original: match[0],
            replacement: match[0].replace(originalUrl, blobUrl)
          });
          totalReplacements++;
          console.log(`✓ Will replace: "${originalUrl}" -> "${blobUrl}"`);
        } catch (e) {
          console.error(`✗ Invalid blob URL: ${blobUrl}`, e);
        }
      } else {
        console.warn(`✗ Could not resolve ${pattern.type}: "${originalUrl}" (resolved as "${resolvedPath}")`);
      }
    }

    // Aplicar reemplazos
    replacements.forEach(replacement => {
      modifiedHtml = modifiedHtml.replace(replacement.original, replacement.replacement);
    });
  });

  console.log('===== HTML REWRITER SUMMARY =====');
  console.log(`Total replacements made: ${totalReplacements}`);
  console.log('Replacement log:', replacementLog);
  console.log('Modified HTML length:', modifiedHtml.length);
  console.log('===== HTML REWRITER END =====');
  
  return modifiedHtml;
}

function isAbsoluteUrl(url: string): boolean {
  const isAbsolute = /^https?:\/\//.test(url) || url.startsWith('//') || url.startsWith('blob:');
  console.log(`URL "${url}" is absolute: ${isAbsolute}`);
  return isAbsolute;
}

function cleanUrlPath(url: string): string {
  // Quitar parámetros de consulta y fragmentos
  const cleaned = url.split('?')[0].split('#')[0];
  console.log(`Cleaned "${url}" -> "${cleaned}"`);
  return cleaned;
}

function resolveRelativePath(relativePath: string, basePath: string): string {
  console.log(`===== RESOLVING RELATIVE PATH =====`);
  console.log(`Relative path: "${relativePath}"`);
  console.log(`Base path: "${basePath}"`);
  
  // Si la ruta relativa es absoluta (empieza con /), devolverla sin el /
  if (relativePath.startsWith('/')) {
    const resolved = relativePath.substring(1);
    console.log(`Absolute path resolved: "${resolved}"`);
    return resolved;
  }
  
  // Obtener el directorio base
  const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
  console.log(`Base directory: "${baseDir}"`);
  
  // Resolver la ruta paso a paso
  const pathParts = relativePath.split('/');
  const baseParts = baseDir ? baseDir.split('/') : [];
  
  console.log(`Path parts:`, pathParts);
  console.log(`Base parts:`, baseParts);
  
  const resolvedParts = [...baseParts];
  
  for (const part of pathParts) {
    if (part === '..') {
      if (resolvedParts.length > 0) {
        resolvedParts.pop();
        console.log(`Going up directory, parts now:`, resolvedParts);
      }
    } else if (part !== '.' && part !== '') {
      resolvedParts.push(part);
      console.log(`Adding part "${part}", parts now:`, resolvedParts);
    }
  }
  
  const resolved = resolvedParts.join('/');
  console.log(`Final resolved path: "${resolved}"`);
  return resolved;
}
