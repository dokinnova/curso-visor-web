
import { useState, useEffect, useRef } from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';

export const useSCORMContentLoader = (resource: Resource, scormPackage: SCORMPackage) => {
  const [contentUrl, setContentUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [resource, scormPackage]);

  const loadContent = async () => {
    console.log('[SCORM Loader] STARTING - Simple approach');
    console.log('[SCORM Loader] Resource:', resource);
    console.log('[SCORM Loader] Package files count:', scormPackage.files.size);
    
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      // Crear un Map para almacenar las URLs de todos los archivos
      const fileUrls = new Map<string, string>();
      
      // Crear URLs blob para todos los archivos
      console.log('[SCORM Loader] Creating blob URLs for all files...');
      for (const [path, file] of scormPackage.files.entries()) {
        const blobUrl = URL.createObjectURL(file);
        fileUrls.set(path, blobUrl);
        console.log(`[SCORM Loader] Created blob for: ${path} -> ${blobUrl}`);
      }
      
      // Buscar archivo HTML principal
      let htmlFile: File | undefined;
      let htmlPath = '';

      if (resource.href) {
        htmlFile = scormPackage.files.get(resource.href);
        htmlPath = resource.href;
        console.log(`[SCORM Loader] Using resource href: ${htmlPath}`);
      }

      if (!htmlFile) {
        console.log('[SCORM Loader] No resource href, searching for main HTML...');
        for (const [path, file] of scormPackage.files.entries()) {
          if (path.toLowerCase().includes('index.html') || path.toLowerCase().endsWith('.html')) {
            htmlFile = file;
            htmlPath = path;
            console.log(`[SCORM Loader] Found HTML: ${htmlPath}`);
            break;
          }
        }
      }

      if (!htmlFile) {
        throw new Error('No se encontró archivo HTML principal');
      }

      // Leer contenido HTML
      const htmlContent = await htmlFile.text();
      console.log('[SCORM Loader] HTML content length:', htmlContent.length);
      
      // Reemplazar URLs en el HTML de forma más robusta
      let modifiedHtml = htmlContent;
      
      console.log('[SCORM Loader] Original HTML preview:');
      console.log(htmlContent.substring(0, 500));
      
      // Crear un mapa de nombres de archivo a URLs blob para búsqueda rápida
      const fileNameMap = new Map<string, string>();
      fileUrls.forEach((blobUrl, filePath) => {
        const fileName = filePath.split('/').pop();
        if (fileName) {
          fileNameMap.set(fileName, blobUrl);
        }
        fileNameMap.set(filePath, blobUrl);
      });
      
      // Reemplazar todas las referencias usando un regex más amplio
      const urlPattern = /((?:src|href|url)\s*[=:]\s*["']?)([^"'>\s)]+\.(js|css|html|svg|png|jpg|jpeg|gif|json))(["']?)/gi;
      
      modifiedHtml = modifiedHtml.replace(urlPattern, (match, prefix, url, extension, suffix) => {
        console.log(`[SCORM Loader] Processing URL: ${url}`);
        
        // Limpiar la URL (quitar ./ o /)
        let cleanUrl = url.replace(/^\.\//, '').replace(/^\//, '');
        
        // Buscar por ruta completa primero
        if (fileUrls.has(cleanUrl)) {
          const blobUrl = fileUrls.get(cleanUrl);
          console.log(`[SCORM Loader] Direct match: ${url} -> ${blobUrl}`);
          return prefix + blobUrl + suffix;
        }
        
        // Buscar por nombre de archivo
        const fileName = cleanUrl.split('/').pop();
        if (fileName && fileNameMap.has(fileName)) {
          const blobUrl = fileNameMap.get(fileName);
          console.log(`[SCORM Loader] Filename match: ${url} -> ${blobUrl}`);
          return prefix + blobUrl + suffix;
        }
        
        console.log(`[SCORM Loader] No match found for: ${url}`);
        return match;
      });
      
      
      console.log('[SCORM Loader] Modified HTML preview:');
      console.log(modifiedHtml.substring(0, 500));
      
      // Inyectar API SCORM mejorada
      const scormApi = `
        <script>
          console.log('SCORM API injected successfully');
          window.API = {
            LMSInitialize: (param) => { console.log('LMSInitialize:', param); return 'true'; },
            LMSFinish: (param) => { console.log('LMSFinish:', param); return 'true'; },
            LMSGetValue: (element) => { console.log('LMSGetValue:', element); return ''; },
            LMSSetValue: (element, value) => { console.log('LMSSetValue:', element, value); return 'true'; },
            LMSCommit: (param) => { console.log('LMSCommit:', param); return 'true'; },
            LMSGetLastError: () => '0',
            LMSGetErrorString: (code) => 'No error',
            LMSGetDiagnostic: (code) => 'No error'
          };
          window.API_1484_11 = window.API;
        </script>
      `;
      
      if (modifiedHtml.includes('</head>')) {
        modifiedHtml = modifiedHtml.replace('</head>', scormApi + '</head>');
      } else if (modifiedHtml.includes('<head>')) {
        modifiedHtml = modifiedHtml.replace('<head>', '<head>' + scormApi);
      } else {
        modifiedHtml = scormApi + modifiedHtml;
      }
      
      // Crear blob del HTML modificado
      const htmlBlob = new Blob([modifiedHtml], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      console.log('[SCORM Loader] ✓ Final HTML blob created:', htmlUrl);
      setContentUrl(htmlUrl);

    } catch (err) {
      console.error('[SCORM Loader] ERROR:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar contenido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    loadContent();
  };

  return {
    contentUrl,
    error,
    isLoading,
    retry
  };
};
