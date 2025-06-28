
export interface RewriteContext {
  getFileUrl: (path: string) => string | null;
  basePath: string;
}

export function rewriteHtmlContent(htmlContent: string, context: RewriteContext): string {
  console.log('===== HTML REWRITER START =====');
  console.log('Base path:', context.basePath);
  console.log('Original HTML length:', htmlContent.length);
  
  let modifiedHtml = htmlContent;
  
  // Patrones mejorados para encontrar referencias a recursos
  const patterns = [
    { regex: /(\bhref\s*=\s*["'])([^"']+)(["'])/gi, type: 'href', group: 2 },
    { regex: /(\bsrc\s*=\s*["'])([^"']+)(["'])/gi, type: 'src', group: 2 },
    { regex: /(\baction\s*=\s*["'])([^"']+)(["'])/gi, type: 'action', group: 2 },
    { regex: /(\bbackground\s*=\s*["'])([^"']+)(["'])/gi, type: 'background', group: 2 }
  ];

  let totalReplacements = 0;
  const replacementLog: Array<{type: string, original: string, resolved: string, blobUrl: string | null, success: boolean}> = [];

  patterns.forEach(pattern => {
    const replacements: Array<{ from: string; to: string }> = [];
    let match;
    
    // Reset regex index
    pattern.regex.lastIndex = 0;
    
    // Crear una copia del HTML original para esta iteración
    const htmlForPattern = modifiedHtml;
    
    while ((match = pattern.regex.exec(htmlForPattern)) !== null) {
      const fullMatch = match[0];
      const prefix = match[1];
      const originalUrl = match[pattern.group];
      const suffix = match[3];
      
      console.log(`===== PROCESSING ${pattern.type.toUpperCase()}: "${originalUrl}" =====`);
      
      // Skip si es una URL absoluta, data URL, o fragmento
      if (isAbsoluteUrl(originalUrl) || originalUrl.startsWith('data:') || originalUrl.startsWith('#') || originalUrl.startsWith('mailto:') || originalUrl.startsWith('tel:')) {
        console.log(`Skipping special URL: ${originalUrl}`);
        continue;
      }

      // Limpiar la URL de parámetros y fragmentos para resolución
      const cleanUrl = cleanUrlPath(originalUrl);
      console.log(`Cleaned URL: "${cleanUrl}"`);

      // Resolver la ruta relativa de manera más robusta
      const resolvedPath = resolveRelativePath(cleanUrl, context.basePath);
      console.log(`Resolved path: "${resolvedPath}"`);
      
      const blobUrl = context.getFileUrl(resolvedPath);
      console.log(`Blob URL result: ${blobUrl || 'NOT FOUND'}`);
      
      let success = false;
      
      if (blobUrl && isValidBlobUrl(blobUrl)) {
        // Preservar parámetros y fragmentos originales si los había
        const finalUrl = preserveUrlParameters(originalUrl, blobUrl);
        const newAttribute = `${prefix}${finalUrl}${suffix}`;
        
        replacements.push({
          from: fullMatch,
          to: newAttribute
        });
        
        totalReplacements++;
        success = true;
        console.log(`✓ Will replace: "${fullMatch}" -> "${newAttribute}"`);
      } else {
        console.warn(`✗ Could not resolve or invalid blob URL for: "${originalUrl}"`);
      }
      
      replacementLog.push({
        type: pattern.type,
        original: originalUrl,
        resolved: resolvedPath,
        blobUrl: blobUrl,
        success: success
      });
    }

    // Aplicar todos los reemplazos para este patrón
    replacements.forEach(replacement => {
      modifiedHtml = modifiedHtml.replace(replacement.from, replacement.to);
    });
  });

  console.log('===== HTML REWRITER SUMMARY =====');
  console.log(`Total replacements made: ${totalReplacements}`);
  console.log('Replacement log:', replacementLog);
  console.log('Modified HTML length:', modifiedHtml.length);
  
  // Verificar que el HTML modificado es válido
  if (modifiedHtml.length === 0) {
    console.error('ERROR: Modified HTML is empty!');
    return htmlContent; // Devolver original si hay error
  }
  
  console.log('===== HTML REWRITER END =====');
  
  return modifiedHtml;
}

function isAbsoluteUrl(url: string): boolean {
  const isAbsolute = /^https?:\/\//.test(url) || url.startsWith('//') || url.startsWith('blob:') || url.startsWith('file:');
  console.log(`URL "${url}" is absolute: ${isAbsolute}`);
  return isAbsolute;
}

function cleanUrlPath(url: string): string {
  // Quitar parámetros de consulta y fragmentos para resolución de archivo
  const cleaned = url.split('?')[0].split('#')[0];
  console.log(`Cleaned "${url}" -> "${cleaned}"`);
  return cleaned;
}

function preserveUrlParameters(originalUrl: string, blobUrl: string): string {
  // Extraer parámetros y fragmentos del URL original
  const queryIndex = originalUrl.indexOf('?');
  const hashIndex = originalUrl.indexOf('#');
  
  let params = '';
  if (queryIndex !== -1) {
    if (hashIndex !== -1 && hashIndex > queryIndex) {
      params = originalUrl.substring(queryIndex, hashIndex);
    } else {
      params = originalUrl.substring(queryIndex);
    }
  }
  
  let fragment = '';
  if (hashIndex !== -1) {
    fragment = originalUrl.substring(hashIndex);
  }
  
  const finalUrl = blobUrl + params + fragment;
  console.log(`Preserved parameters: "${originalUrl}" -> "${finalUrl}"`);
  return finalUrl;
}

function isValidBlobUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const isValid = urlObj.protocol === 'blob:' && urlObj.href.length > 'blob:'.length;
    console.log(`Blob URL "${url}" is valid: ${isValid}`);
    return isValid;
  } catch (e) {
    console.error(`Invalid blob URL: "${url}"`, e);
    return false;
  }
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
  
  // Si la ruta es solo un nombre de archivo, intentar encontrarlo
  if (!relativePath.includes('/')) {
    console.log(`Simple filename, returning as is: "${relativePath}"`);
    return relativePath;
  }
  
  // Obtener el directorio base del archivo base
  const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
  console.log(`Base directory: "${baseDir}"`);
  
  // Dividir la ruta relativa en partes
  const pathParts = relativePath.split('/').filter(part => part !== '');
  const baseParts = baseDir ? baseDir.split('/').filter(part => part !== '') : [];
  
  console.log(`Path parts:`, pathParts);
  console.log(`Base parts:`, baseParts);
  
  // Resolver paso a paso
  const resolvedParts = [...baseParts];
  
  for (const part of pathParts) {
    if (part === '..') {
      if (resolvedParts.length > 0) {
        resolvedParts.pop();
        console.log(`Going up directory, parts now:`, resolvedParts);
      } else {
        console.warn(`Cannot go up from root directory`);
      }
    } else if (part !== '.') {
      resolvedParts.push(part);
      console.log(`Adding part "${part}", parts now:`, resolvedParts);
    }
  }
  
  const resolved = resolvedParts.join('/');
  console.log(`Final resolved path: "${resolved}"`);
  return resolved;
}
