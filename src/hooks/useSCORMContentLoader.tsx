
import { useState, useEffect, useRef } from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';
import { SimpleFileServer } from '@/utils/fileServerSimple';
import { rewriteHtmlContent } from '@/utils/htmlRewriter';

export const useSCORMContentLoader = (resource: Resource, scormPackage: SCORMPackage) => {
  const [contentUrl, setContentUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const fileServerRef = useRef<SimpleFileServer | null>(null);

  useEffect(() => {
    loadContent();
    
    // Cleanup function
    return () => {
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
      if (contentUrl) {
        URL.revokeObjectURL(contentUrl);
      }
    };
  }, [resource, scormPackage]);

  const loadContent = async () => {
    console.log('[SCORM Loader] Creating comprehensive file server');
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      // Limpiar servidor anterior si existe
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
      
      // Crear nuevo servidor de archivos
      const fileServer = new SimpleFileServer();
      fileServerRef.current = fileServer;
      
      // Agregar TODOS los archivos al servidor con URLs blob
      console.log('[SCORM Loader] Creating blob URLs for all files...');
      for (const [path, file] of scormPackage.files.entries()) {
        fileServer.addFile(path, file);
        console.log(`[SCORM Loader] Added: ${path}`);
      }
      
      // Buscar el archivo HTML principal
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

      console.log(`[SCORM Loader] Processing HTML file: ${htmlPath}`);
      
      // Leer contenido HTML original
      const htmlContent = await htmlFile.text();
      console.log('[SCORM Loader] Original HTML length:', htmlContent.length);
      
      // Reescribir HTML con rutas corregidas a los blobs
      const context = {
        getFileUrl: (path: string) => {
          const url = fileServer.getFileUrl(path);
          console.log(`[SCORM Loader] Resolving ${path} -> ${url || 'NOT FOUND'}`);
          return url;
        },
        basePath: htmlPath.substring(0, htmlPath.lastIndexOf('/')) || ''
      };
      
      console.log('[SCORM Loader] Rewriting HTML content...');
      const rewrittenHtml = rewriteHtmlContent(htmlContent, context);
      console.log('[SCORM Loader] Rewritten HTML length:', rewrittenHtml.length);
      
      // Crear blob con HTML reescrito
      const htmlBlob = new Blob([rewrittenHtml], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      console.log('[SCORM Loader] ✓ Content URL created:', htmlUrl);
      setContentUrl(htmlUrl);

    } catch (err) {
      console.error('[SCORM Loader] Error:', err);
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
