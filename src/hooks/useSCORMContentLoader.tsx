
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
    return () => {
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
    };
  }, [resource, scormPackage]);

  const loadContent = async () => {
    console.log('[SCORM Loader] Starting simplified content load');
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      // Limpiar servidor anterior
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
      fileServerRef.current = new SimpleFileServer();

      // Agregar archivos al servidor
      console.log('[SCORM Loader] Adding files to server');
      for (const [path, file] of scormPackage.files.entries()) {
        fileServerRef.current.addFile(path, file);
      }

      // Encontrar archivo HTML principal
      let htmlFilePath: string | null = null;
      let htmlFileUrl: string | null = null;

      // Usar href del resource
      if (resource.href) {
        console.log(`[SCORM Loader] Using resource href: ${resource.href}`);
        htmlFileUrl = fileServerRef.current.getFileUrl(resource.href);
        if (htmlFileUrl) {
          htmlFilePath = resource.href;
        }
      }

      // Fallback: buscar archivo HTML
      if (!htmlFilePath) {
        htmlFileUrl = fileServerRef.current.findMainFile();
        if (htmlFileUrl) {
          const allFiles = fileServerRef.current.getAllFiles();
          const mainFileEntry = allFiles.find(f => f.url === htmlFileUrl);
          if (mainFileEntry) {
            htmlFilePath = mainFileEntry.path;
          }
        }
      }

      if (!htmlFilePath || !htmlFileUrl) {
        throw new Error(`No se encontró archivo HTML ejecutable`);
      }

      console.log(`[SCORM Loader] Processing HTML file: ${htmlFilePath}`);
      
      // Obtener contenido del archivo HTML
      const htmlFile = scormPackage.files.get(htmlFilePath);
      if (!htmlFile) {
        throw new Error(`No se pudo obtener el archivo HTML: ${htmlFilePath}`);
      }

      const htmlContent = await htmlFile.text();
      console.log('[SCORM Loader] HTML content length:', htmlContent.length);
      
      if (htmlContent.length === 0) {
        throw new Error('El archivo HTML está vacío');
      }

      // Solo inyectar SCORM API, no reescribir URLs
      console.log('[SCORM Loader] Injecting SCORM API');
      const modifiedHtml = rewriteHtmlContent(htmlContent, {
        getFileUrl: (path: string) => fileServerRef.current?.getFileUrl(path) || null,
        basePath: htmlFilePath
      });
      
      if (modifiedHtml.length === 0) {
        throw new Error('Error al procesar el HTML');
      }
      
      // Crear blob con HTML modificado
      console.log('[SCORM Loader] Creating final blob URL');
      const finalBlob = new Blob([modifiedHtml], { 
        type: 'text/html;charset=utf-8' 
      });
      const finalUrl = URL.createObjectURL(finalBlob);
      
      console.log('[SCORM Loader] ✓ Content loaded successfully');
      setContentUrl(finalUrl);

    } catch (err) {
      console.error('[SCORM Loader] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el contenido SCORM';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    console.log('[SCORM Loader] Retrying load');
    loadContent();
  };

  return {
    contentUrl,
    error,
    isLoading,
    retry
  };
};
