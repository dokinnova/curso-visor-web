
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
    console.log('[SCORM Loader] Initializing file server approach');
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
      
      // Agregar todos los archivos al servidor
      console.log('[SCORM Loader] Adding all files to server...');
      for (const [path, file] of scormPackage.files.entries()) {
        fileServer.addFile(path, file);
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
        // Buscar archivo principal
        console.log('[SCORM Loader] Searching for main HTML file...');
        const mainUrl = fileServer.findMainFile();
        if (mainUrl) {
          // Encontrar el archivo correspondiente a esta URL
          for (const [path, file] of scormPackage.files.entries()) {
            if (path.toLowerCase().includes('index.html') || 
                path.toLowerCase().includes('main.html') ||
                path.toLowerCase().endsWith('.html')) {
              htmlFile = file;
              htmlPath = path;
              break;
            }
          }
        }
      }

      if (!htmlFile) {
        throw new Error('No se encontró archivo HTML principal');
      }

      console.log(`[SCORM Loader] Processing HTML file: ${htmlPath}`);
      
      // Leer contenido HTML
      const htmlContent = await htmlFile.text();
      
      // Reescribir HTML con rutas corregidas
      const context = {
        getFileUrl: (path: string) => fileServer.getFileUrl(path),
        basePath: htmlPath.substring(0, htmlPath.lastIndexOf('/')) || ''
      };
      
      const rewrittenHtml = rewriteHtmlContent(htmlContent, context);
      
      // Crear blob con HTML reescrito
      const htmlBlob = new Blob([rewrittenHtml], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      console.log('[SCORM Loader] ✓ Content processed successfully');
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
