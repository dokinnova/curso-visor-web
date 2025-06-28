
export interface RewriteContext {
  getFileUrl: (path: string) => string | null;
  basePath: string;
}

function isSpecialUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/|data:|#|mailto:|tel:|blob:)/.test(url);
}

function cleanUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function resolvePath(relativePath: string, basePath: string): string {
  console.log(`[HTMLRewriter] Resolving path: "${relativePath}" from base: "${basePath}"`);
  
  if (relativePath.startsWith('/')) {
    return relativePath.substring(1);
  }
  
  if (!relativePath.includes('/')) {
    return relativePath;
  }
  
  const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
  const pathParts = relativePath.split('/').filter(part => part !== '');
  const baseParts = baseDir ? baseDir.split('/').filter(part => part !== '') : [];
  
  const resolvedParts = [...baseParts];
  
  for (const part of pathParts) {
    if (part === '..') {
      resolvedParts.pop();
    } else if (part !== '.') {
      resolvedParts.push(part);
    }
  }
  
  const resolved = resolvedParts.join('/');
  console.log(`[HTMLRewriter] Resolved to: "${resolved}"`);
  return resolved;
}

export function rewriteHtmlContent(htmlContent: string, context: RewriteContext): string {
  console.log('[HTMLRewriter] Starting HTML rewrite');
  
  if (!htmlContent || htmlContent.trim().length === 0) {
    console.error('[HTMLRewriter] Empty HTML content received');
    return htmlContent;
  }

  let modifiedHtml = htmlContent;
  let replacements = 0;
  
  const patterns = [
    { regex: /(\bhref\s*=\s*["'])([^"']+)(["'])/gi, type: 'href' },
    { regex: /(\bsrc\s*=\s*["'])([^"']+)(["'])/gi, type: 'src' }
  ];

  for (const pattern of patterns) {
    const matches = [...modifiedHtml.matchAll(pattern.regex)];
    console.log(`[HTMLRewriter] Found ${matches.length} ${pattern.type} attributes`);
    
    for (const match of matches) {
      const fullMatch = match[0];
      const prefix = match[1];
      const originalUrl = match[2];
      const suffix = match[3];
      
      if (isSpecialUrl(originalUrl)) {
        console.log(`[HTMLRewriter] Skipping special URL: ${originalUrl}`);
        continue;
      }

      const cleanedUrl = cleanUrl(originalUrl);
      const resolvedPath = resolvePath(cleanedUrl, context.basePath);
      
      console.log(`[HTMLRewriter] Resolving: "${originalUrl}" -> "${resolvedPath}"`);
      
      const blobUrl = context.getFileUrl(resolvedPath);
      if (blobUrl) {
        const newAttribute = `${prefix}${blobUrl}${suffix}`;
        modifiedHtml = modifiedHtml.replace(fullMatch, newAttribute);
        replacements++;
        console.log(`[HTMLRewriter] ✓ Replaced: ${originalUrl} -> blob URL`);
      } else {
        console.log(`[HTMLRewriter] ✗ No blob URL found for: ${resolvedPath}`);
      }
    }
  }

  console.log(`[HTMLRewriter] Completed: ${replacements} replacements made`);
  return modifiedHtml;
}
