
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

export function rewriteHtmlContent(htmlContent: string, context: RewriteContext): string {
  console.log('[HTMLRewriter] Starting HTML rewrite with URL resolution');
  
  if (!htmlContent || htmlContent.trim().length === 0) {
    console.error('[HTMLRewriter] Empty HTML content received');
    return htmlContent;
  }

  let modifiedHtml = htmlContent;
  
  // Reescribir URLs en atributos src y href
  modifiedHtml = rewriteUrls(modifiedHtml, context);
  
  // Inyectar SCORM API en el head
  const scormApiScript = `
    <script>
      // SCORM 1.2 API Mock
      window.API = {
        LMSInitialize: function(param) {
          console.log('SCORM: LMSInitialize called with', param);
          return 'true';
        },
        LMSFinish: function(param) {
          console.log('SCORM: LMSFinish called with', param);
          return 'true';
        },
        LMSGetValue: function(element) {
          console.log('SCORM: LMSGetValue called with', element);
          return '';
        },
        LMSSetValue: function(element, value) {
          console.log('SCORM: LMSSetValue called with', element, value);
          return 'true';
        },
        LMSCommit: function(param) {
          console.log('SCORM: LMSCommit called with', param);
          return 'true';
        },
        LMSGetLastError: function() {
          return '0';
        },
        LMSGetErrorString: function(errorCode) {
          return 'No error';
        },
        LMSGetDiagnostic: function(errorCode) {
          return 'No error';
        }
      };
      
      // También para SCORM 2004
      window.API_1484_11 = window.API;
      
      console.log('SCORM API injected successfully');
    </script>
  `;
  
  // Insertar el script antes del cierre del head o al inicio del body
  if (modifiedHtml.includes('</head>')) {
    modifiedHtml = modifiedHtml.replace('</head>', scormApiScript + '</head>');
  } else if (modifiedHtml.includes('<body>')) {
    modifiedHtml = modifiedHtml.replace('<body>', '<body>' + scormApiScript);
  } else {
    modifiedHtml = scormApiScript + modifiedHtml;
  }
  
  console.log('[HTMLRewriter] HTML rewrite completed successfully');
  return modifiedHtml;
}

function rewriteUrls(html: string, context: RewriteContext): string {
  console.log('[HTMLRewriter] Rewriting URLs...');
  
  // Patrón para encontrar atributos src y href
  const urlPattern = /((?:src|href)\s*=\s*["']?)([^"'>\s]+)(["']?)/gi;
  
  return html.replace(urlPattern, (match, prefix, url, suffix) => {
    // Saltar URLs especiales
    if (isSpecialUrl(url)) {
      return match;
    }
    
    // Limpiar URL
    const cleanedUrl = cleanUrl(url);
    
    // Resolver ruta
    const resolvedPath = resolvePath(cleanedUrl, context.basePath);
    
    // Obtener URL del servidor de archivos
    const fileUrl = context.getFileUrl(resolvedPath);
    
    if (fileUrl) {
      console.log(`[HTMLRewriter] Rewritten: ${url} -> ${fileUrl}`);
      return prefix + fileUrl + suffix;
    }
    
    console.log(`[HTMLRewriter] No file found for: ${url} (resolved: ${resolvedPath})`);
    return match;
  });
}

function resolvePath(url: string, basePath: string): string {
  // Si la URL ya es absoluta (empieza con /), usarla directamente
  if (url.startsWith('/')) {
    return url.substring(1);
  }
  
  // Si no hay basePath, usar la URL tal como está
  if (!basePath) {
    return url;
  }
  
  // Resolver ruta relativa
  const pathParts = basePath.split('/');
  const urlParts = url.split('/');
  
  // Procesar ".." en la URL
  for (const part of urlParts) {
    if (part === '..') {
      pathParts.pop();
    } else if (part !== '.' && part !== '') {
      pathParts.push(part);
    }
  }
  
  return pathParts.join('/');
}
