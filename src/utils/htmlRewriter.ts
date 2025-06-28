
export interface RewriteContext {
  getFileUrl: (path: string) => string | null;
  basePath: string;
}

export function rewriteHtmlContent(htmlContent: string, context: RewriteContext): string {
  console.log('=== HTML REWRITER ===');
  console.log('Starting HTML rewrite process...');
  
  let modifiedHtml = htmlContent;
  
  // Patrones para encontrar referencias a recursos
  const patterns = [
    // href attributes (CSS, links)
    { regex: /href\s*=\s*["']([^"']+)["']/gi, type: 'href' },
    // src attributes (JS, images, etc)
    { regex: /src\s*=\s*["']([^"']+)["']/gi, type: 'src' },
    // action attributes (forms)
    { regex: /action\s*=\s*["']([^"']+)["']/gi, type: 'action' },
    // background attributes
    { regex: /background\s*=\s*["']([^"']+)["']/gi, type: 'background' }
  ];

  let totalReplacements = 0;

  patterns.forEach(pattern => {
    let match;
    const replacements: Array<{ original: string; replacement: string }> = [];

    // Reset regex index
    pattern.regex.lastIndex = 0;
    
    while ((match = pattern.regex.exec(htmlContent)) !== null) {
      const originalUrl = match[1];
      
      // Skip si es una URL absoluta o data URL
      if (isAbsoluteUrl(originalUrl) || originalUrl.startsWith('data:') || originalUrl.startsWith('#')) {
        continue;
      }

      // Resolver la ruta relativa
      const resolvedPath = resolveRelativePath(originalUrl, context.basePath);
      const blobUrl = context.getFileUrl(resolvedPath);
      
      if (blobUrl) {
        console.log(`Rewriting ${pattern.type}: "${originalUrl}" -> "${blobUrl}"`);
        replacements.push({
          original: match[0],
          replacement: match[0].replace(originalUrl, blobUrl)
        });
        totalReplacements++;
      } else {
        console.warn(`Could not resolve ${pattern.type}: "${originalUrl}" (resolved as "${resolvedPath}")`);
      }
    }

    // Aplicar reemplazos
    replacements.forEach(replacement => {
      modifiedHtml = modifiedHtml.replace(replacement.original, replacement.replacement);
    });
  });

  console.log(`HTML rewrite complete. Total replacements: ${totalReplacements}`);
  return modifiedHtml;
}

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//.test(url) || url.startsWith('//') || url.startsWith('blob:');
}

function resolveRelativePath(relativePath: string, basePath: string): string {
  // Limpiar la ruta
  let cleanPath = relativePath.replace(/^\.\//, '');
  
  // Si basePath tiene directorio, combinarlo
  if (basePath.includes('/')) {
    const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
    if (baseDir && !cleanPath.startsWith('/')) {
      cleanPath = baseDir + '/' + cleanPath;
    }
  }
  
  return cleanPath;
}
