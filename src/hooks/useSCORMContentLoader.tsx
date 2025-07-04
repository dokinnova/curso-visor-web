
import { useState, useEffect } from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';
import { SimpleFileServer } from '@/utils/fileServerSimple';
import { rewriteHtmlContent } from '@/utils/htmlRewriter';

export const useSCORMContentLoader = (resource: Resource, scormPackage: SCORMPackage) => {
  const [contentUrl, setContentUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [resource, scormPackage]);

  const loadContent = async () => {
    console.log('[SCORM Loader] Starting with SimpleFileServer approach');
    console.log('[SCORM Loader] Resource:', resource);
    console.log('[SCORM Loader] Package files count:', scormPackage.files.size);
    
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      // Crear servidor de archivos simple
      const fileServer = new SimpleFileServer();
      
      // Agregar todos los archivos al servidor
      console.log('[SCORM Loader] Adding files to server...');
      for (const [path, file] of scormPackage.files.entries()) {
        fileServer.addFile(path, file);
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
      console.log('[SCORM Loader] Original HTML preview:', htmlContent.substring(0, 500));
      
      // Reescribir HTML usando el htmlRewriter
      const basePath = htmlPath.includes('/') ? htmlPath.substring(0, htmlPath.lastIndexOf('/')) : '';
      const rewriteContext = {
        getFileUrl: (path: string) => fileServer.getFileUrl(path),
        basePath
      };
      
      const modifiedHtml = rewriteHtmlContent(htmlContent, rewriteContext);
      console.log('[SCORM Loader] Modified HTML preview:', modifiedHtml.substring(0, 500));
      
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
