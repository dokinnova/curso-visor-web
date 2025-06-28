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
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      // Limpiar servidor anterior
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
      fileServerRef.current = new SimpleFileServer();

      console.log('=== SCORM LOADING WITH HTML REWRITING ===');
      console.log('Resource:', resource);
      
      // Agregar todos los archivos al servidor simple
      for (const [path, file] of scormPackage.files.entries()) {
        fileServerRef.current.addFile(path, file);
      }

      let htmlFilePath: string | null = null;

      // Estrategia 1: Usar el href del resource si existe
      if (resource.href) {
        console.log(`Trying resource href: ${resource.href}`);
        const url = fileServerRef.current.getFileUrl(resource.href);
        if (url) {
          htmlFilePath = resource.href;
          console.log(`SUCCESS: Using resource href ${resource.href}`);
        }
      }

      // Estrategia 2: Buscar en los archivos del resource
      if (!htmlFilePath && resource.files && resource.files.length > 0) {
        console.log('Trying resource files:', resource.files);
        
        for (const fileName of resource.files) {
          if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
            const url = fileServerRef.current.getFileUrl(fileName);
            if (url) {
              htmlFilePath = fileName;
              console.log(`SUCCESS: Using resource file ${fileName}`);
              break;
            }
          }
        }
      }

      // Estrategia 3: Buscar archivo principal común
      if (!htmlFilePath) {
        console.log('Searching for main entry file...');
        const mainFileUrl = fileServerRef.current.findMainFile();
        if (mainFileUrl) {
          // Encontrar la ruta del archivo principal
          const allFiles = fileServerRef.current.getAllFiles();
          const mainFile = allFiles.find(f => f.url === mainFileUrl);
          if (mainFile) {
            htmlFilePath = mainFile.path;
            console.log('SUCCESS: Found main entry file:', htmlFilePath);
          }
        }
      }

      if (htmlFilePath) {
        console.log(`Processing HTML file: ${htmlFilePath}`);
        
        // Obtener el archivo HTML original
        const htmlFile = scormPackage.files.get(htmlFilePath);
        if (htmlFile) {
          // Leer el contenido del archivo HTML
          const htmlContent = await htmlFile.text();
          console.log('Original HTML content length:', htmlContent.length);
          
          // Reescribir las URLs en el HTML
          const rewrittenHtml = rewriteHtmlContent(htmlContent, {
            getFileUrl: (path: string) => fileServerRef.current?.getFileUrl(path) || null,
            basePath: htmlFilePath
          });
          
          console.log('Rewritten HTML content length:', rewrittenHtml.length);
          
          // Crear un nuevo blob con el HTML modificado
          const rewrittenBlob = new Blob([rewrittenHtml], { type: 'text/html' });
          const rewrittenUrl = URL.createObjectURL(rewrittenBlob);
          
          console.log(`Final rewritten URL: ${rewrittenUrl}`);
          setContentUrl(rewrittenUrl);
        } else {
          throw new Error(`Could not find HTML file: ${htmlFilePath}`);
        }
      } else {
        const allFiles = fileServerRef.current.getAllFiles();
        console.error('No HTML file found. Available files:', allFiles.map(f => f.path));
        throw new Error(`No se encontró archivo HTML ejecutable. Archivos disponibles: ${allFiles.map(f => f.path).join(', ')}`);
      }

    } catch (err) {
      console.error('Error loading SCORM content:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el contenido SCORM');
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
