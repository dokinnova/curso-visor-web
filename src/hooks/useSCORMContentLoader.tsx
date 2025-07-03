
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
      
      // Reemplazar URLs en el HTML de forma simple
      let modifiedHtml = htmlContent;
      
      // Reemplazar rutas relativas de assets con URLs blob
      fileUrls.forEach((blobUrl, filePath) => {
        // Buscar diferentes patrones de referencia al archivo
        const fileName = filePath.split('/').pop();
        const patterns = [
          new RegExp(`"${filePath}"`, 'g'),
          new RegExp(`'${filePath}'`, 'g'),
          new RegExp(`"\\.\/${filePath}"`, 'g'),
          new RegExp(`'\\./${filePath}'`, 'g')
        ];
        
        patterns.forEach(pattern => {
          if (modifiedHtml.match(pattern)) {
            modifiedHtml = modifiedHtml.replace(pattern, `"${blobUrl}"`);
            console.log(`[SCORM Loader] Replaced ${filePath} with blob URL`);
          }
        });
      });
      
      // Inyectar API SCORM
      const scormApi = `
        <script>
          window.API = {
            LMSInitialize: () => 'true',
            LMSFinish: () => 'true',
            LMSGetValue: (element) => '',
            LMSSetValue: () => 'true',
            LMSCommit: () => 'true',
            LMSGetLastError: () => '0',
            LMSGetErrorString: () => 'No error',
            LMSGetDiagnostic: () => 'No error'
          };
          window.API_1484_11 = window.API;
        </script>
      `;
      
      if (modifiedHtml.includes('</head>')) {
        modifiedHtml = modifiedHtml.replace('</head>', scormApi + '</head>');
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
