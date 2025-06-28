
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
    console.log('[SCORM Loader] Starting content load');
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
      let filesAdded = 0;
      for (const [path, file] of scormPackage.files.entries()) {
        try {
          fileServerRef.current.addFile(path, file);
          filesAdded++;
        } catch (error) {
          console.error(`[SCORM Loader] Failed to add file ${path}:`, error);
        }
      }

      if (filesAdded === 0) {
        throw new Error('No se pudieron agregar archivos al servidor');
      }

      console.log(`[SCORM Loader] Added ${filesAdded} files to server`);

      // Encontrar archivo HTML principal
      let htmlFilePath: string | null = null;
      let htmlFileUrl: string | null = null;

      // Estrategia 1: Usar href del resource
      if (resource.href) {
        console.log(`[SCORM Loader] Trying resource href: ${resource.href}`);
        htmlFileUrl = fileServerRef.current.getFileUrl(resource.href);
        if (htmlFileUrl) {
          htmlFilePath = resource.href;
          console.log('[SCORM Loader] ✓ Using resource href');
        }
      }

      // Estrategia 2: Buscar en archivos del resource
      if (!htmlFilePath && resource.files && resource.files.length > 0) {
        console.log('[SCORM Loader] Trying resource files');
        for (const fileName of resource.files) {
          if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
            htmlFileUrl = fileServerRef.current.getFileUrl(fileName);
            if (htmlFileUrl) {
              htmlFilePath = fileName;
              console.log(`[SCORM Loader] ✓ Using resource file: ${fileName}`);
              break;
            }
          }
        }
      }

      // Estrategia 3: Buscar archivo principal común
      if (!htmlFilePath) {
        console.log('[SCORM Loader] Searching for main file');
        htmlFileUrl = fileServerRef.current.findMainFile();
        if (htmlFileUrl) {
          const allFiles = fileServerRef.current.getAllFiles();
          const mainFileEntry = allFiles.find(f => f.url === htmlFileUrl);
          if (mainFileEntry) {
            htmlFilePath = mainFileEntry.path;
            console.log(`[SCORM Loader] ✓ Found main file: ${htmlFilePath}`);
          }
        }
      }

      if (!htmlFilePath || !htmlFileUrl) {
        const allFiles = fileServerRef.current.getAllFiles();
        console.error('[SCORM Loader] No HTML file found. Available files:', allFiles.map(f => f.path));
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

      // Reescribir URLs en el HTML
      console.log('[SCORM Loader] Rewriting HTML content');
      const rewrittenHtml = rewriteHtmlContent(htmlContent, {
        getFileUrl: (path: string) => fileServerRef.current?.getFileUrl(path) || null,
        basePath: htmlFilePath
      });
      
      if (rewrittenHtml.length === 0) {
        console.error('[SCORM Loader] Rewritten HTML is empty, using original');
        throw new Error('Error al procesar el HTML');
      }
      
      // Crear blob con HTML modificado
      console.log('[SCORM Loader] Creating final blob URL');
      const rewrittenBlob = new Blob([rewrittenHtml], { 
        type: 'text/html;charset=utf-8' 
      });
      const finalUrl = URL.createObjectURL(rewrittenBlob);
      
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
