
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
      console.log('===== SCORM DIAGNOSTIC START =====');
      console.log('Resource:', JSON.stringify(resource, null, 2));
      console.log('Total files in package:', scormPackage.files.size);
      
      // Limpiar servidor anterior
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
      fileServerRef.current = new SimpleFileServer();

      // Agregar todos los archivos al servidor simple
      console.log('===== ADDING FILES TO SERVER =====');
      for (const [path, file] of scormPackage.files.entries()) {
        const blobUrl = fileServerRef.current.addFile(path, file);
        console.log(`Added: ${path} -> ${blobUrl}`);
      }

      // Mostrar todos los archivos disponibles
      const allFiles = fileServerRef.current.getAllFiles();
      console.log('===== ALL AVAILABLE FILES =====');
      allFiles.forEach(file => {
        console.log(`Path: ${file.path} | URL: ${file.url}`);
      });

      let htmlFilePath: string | null = null;

      // Estrategia 1: Usar el href del resource si existe
      if (resource.href) {
        console.log(`===== TRYING RESOURCE HREF: ${resource.href} =====`);
        const url = fileServerRef.current.getFileUrl(resource.href);
        if (url) {
          htmlFilePath = resource.href;
          console.log(`SUCCESS: Using resource href ${resource.href}`);
        } else {
          console.log(`FAILED: Could not find file for href ${resource.href}`);
        }
      }

      // Estrategia 2: Buscar en los archivos del resource
      if (!htmlFilePath && resource.files && resource.files.length > 0) {
        console.log('===== TRYING RESOURCE FILES =====');
        console.log('Resource files:', resource.files);
        
        for (const fileName of resource.files) {
          if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
            console.log(`Checking file: ${fileName}`);
            const url = fileServerRef.current.getFileUrl(fileName);
            if (url) {
              htmlFilePath = fileName;
              console.log(`SUCCESS: Using resource file ${fileName}`);
              break;
            } else {
              console.log(`FAILED: Could not find ${fileName}`);
            }
          }
        }
      }

      // Estrategia 3: Buscar archivo principal común
      if (!htmlFilePath) {
        console.log('===== SEARCHING FOR MAIN ENTRY FILE =====');
        const mainFileUrl = fileServerRef.current.findMainFile();
        if (mainFileUrl) {
          const allFiles = fileServerRef.current.getAllFiles();
          const mainFile = allFiles.find(f => f.url === mainFileUrl);
          if (mainFile) {
            htmlFilePath = mainFile.path;
            console.log('SUCCESS: Found main entry file:', htmlFilePath);
          }
        } else {
          console.log('FAILED: No main entry file found');
        }
      }

      if (htmlFilePath) {
        console.log(`===== PROCESSING HTML FILE: ${htmlFilePath} =====`);
        
        // Obtener el archivo HTML original
        const htmlFile = scormPackage.files.get(htmlFilePath);
        if (htmlFile) {
          // Leer el contenido del archivo HTML
          const htmlContent = await htmlFile.text();
          console.log('===== ORIGINAL HTML CONTENT =====');
          console.log('Original HTML length:', htmlContent.length);
          console.log('First 500 chars:', htmlContent.substring(0, 500));
          console.log('Last 500 chars:', htmlContent.substring(Math.max(0, htmlContent.length - 500)));
          
          // Verificar que todas las URLs blob son válidas antes del rewriting
          console.log('===== VALIDATING BLOB URLS =====');
          const invalidUrls: string[] = [];
          allFiles.forEach(file => {
            try {
              new URL(file.url);
              console.log(`✓ Valid URL: ${file.url}`);
            } catch (e) {
              console.error(`✗ Invalid URL: ${file.url}`, e);
              invalidUrls.push(file.url);
            }
          });
          
          if (invalidUrls.length > 0) {
            throw new Error(`Invalid blob URLs found: ${invalidUrls.join(', ')}`);
          }
          
          // Reescribir las URLs en el HTML
          console.log('===== STARTING HTML REWRITING =====');
          const rewrittenHtml = rewriteHtmlContent(htmlContent, {
            getFileUrl: (path: string) => {
              const url = fileServerRef.current?.getFileUrl(path);
              console.log(`HTML Rewriter requested: "${path}" -> ${url || 'NOT FOUND'}`);
              return url;
            },
            basePath: htmlFilePath
          });
          
          console.log('===== REWRITTEN HTML CONTENT =====');
          console.log('Rewritten HTML length:', rewrittenHtml.length);
          console.log('First 500 chars:', rewrittenHtml.substring(0, 500));
          console.log('Last 500 chars:', rewrittenHtml.substring(Math.max(0, rewrittenHtml.length - 500)));
          
          // Verificar que el HTML reescrito es válido
          if (rewrittenHtml.length === 0) {
            throw new Error('Rewritten HTML is empty');
          }
          
          if (rewrittenHtml === htmlContent) {
            console.warn('WARNING: HTML content unchanged after rewriting');
          }
          
          // Crear un nuevo blob con el HTML modificado
          console.log('===== CREATING FINAL BLOB URL =====');
          const rewrittenBlob = new Blob([rewrittenHtml], { type: 'text/html' });
          const rewrittenUrl = URL.createObjectURL(rewrittenBlob);
          
          // Validar la URL final
          try {
            new URL(rewrittenUrl);
            console.log(`✓ Final rewritten URL is valid: ${rewrittenUrl}`);
          } catch (e) {
            console.error(`✗ Final rewritten URL is invalid: ${rewrittenUrl}`, e);
            throw new Error(`Invalid final blob URL: ${rewrittenUrl}`);
          }
          
          console.log('===== DIAGNOSTIC SUCCESS =====');
          setContentUrl(rewrittenUrl);
        } else {
          throw new Error(`Could not find HTML file: ${htmlFilePath}`);
        }
      } else {
        const allFiles = fileServerRef.current.getAllFiles();
        console.error('===== NO HTML FILE FOUND =====');
        console.error('Available files:', allFiles.map(f => f.path));
        throw new Error(`No se encontró archivo HTML ejecutable. Archivos disponibles: ${allFiles.map(f => f.path).join(', ')}`);
      }

    } catch (err) {
      console.error('===== SCORM LOADING ERROR =====');
      console.error('Error details:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el contenido SCORM');
    } finally {
      console.log('===== SCORM DIAGNOSTIC END =====');
      setIsLoading(false);
    }
  };

  const retry = () => {
    console.log('===== RETRYING SCORM LOAD =====');
    loadContent();
  };

  return {
    contentUrl,
    error,
    isLoading,
    retry
  };
};
