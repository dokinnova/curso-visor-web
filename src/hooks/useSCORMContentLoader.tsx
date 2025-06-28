
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
      console.log('===== SCORM CONTENT LOADING START =====');
      console.log('Resource:', JSON.stringify(resource, null, 2));
      console.log('Total files in package:', scormPackage.files.size);
      
      // Limpiar servidor anterior
      if (fileServerRef.current) {
        fileServerRef.current.clear();
      }
      fileServerRef.current = new SimpleFileServer();

      // Agregar todos los archivos al servidor
      console.log('===== ADDING FILES TO SERVER =====');
      let filesAdded = 0;
      for (const [path, file] of scormPackage.files.entries()) {
        try {
          const blobUrl = fileServerRef.current.addFile(path, file);
          console.log(`✓ Added: ${path} -> ${blobUrl}`);
          filesAdded++;
        } catch (error) {
          console.error(`✗ Failed to add file ${path}:`, error);
        }
      }

      if (filesAdded === 0) {
        throw new Error('No se pudieron agregar archivos al servidor');
      }

      // Verificar archivos disponibles
      const allFiles = fileServerRef.current.getAllFiles();
      console.log('===== ALL AVAILABLE FILES =====');
      allFiles.forEach(file => {
        console.log(`Path: ${file.path} | URL: ${file.url} | Valid: ${file.valid}`);
      });

      // Encontrar el archivo HTML principal
      let htmlFilePath: string | null = null;
      let htmlFileUrl: string | null = null;

      // Estrategia 1: Usar el href del resource si existe
      if (resource.href) {
        console.log(`===== TRYING RESOURCE HREF: ${resource.href} =====`);
        htmlFileUrl = fileServerRef.current.getFileUrl(resource.href);
        if (htmlFileUrl) {
          htmlFilePath = resource.href;
          console.log(`✓ SUCCESS: Using resource href ${resource.href}`);
        } else {
          console.log(`✗ FAILED: Could not find file for href ${resource.href}`);
        }
      }

      // Estrategia 2: Buscar en los archivos del resource
      if (!htmlFilePath && resource.files && resource.files.length > 0) {
        console.log('===== TRYING RESOURCE FILES =====');
        console.log('Resource files:', resource.files);
        
        for (const fileName of resource.files) {
          if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
            console.log(`Checking file: ${fileName}`);
            htmlFileUrl = fileServerRef.current.getFileUrl(fileName);
            if (htmlFileUrl) {
              htmlFilePath = fileName;
              console.log(`✓ SUCCESS: Using resource file ${fileName}`);
              break;
            } else {
              console.log(`✗ FAILED: Could not find ${fileName}`);
            }
          }
        }
      }

      // Estrategia 3: Buscar archivo principal común
      if (!htmlFilePath) {
        console.log('===== SEARCHING FOR MAIN ENTRY FILE =====');
        htmlFileUrl = fileServerRef.current.findMainFile();
        if (htmlFileUrl) {
          const mainFileEntry = allFiles.find(f => f.url === htmlFileUrl);
          if (mainFileEntry) {
            htmlFilePath = mainFileEntry.path;
            console.log(`✓ SUCCESS: Found main entry file: ${htmlFilePath}`);
          }
        } else {
          console.log('✗ FAILED: No main entry file found');
        }
      }

      if (!htmlFilePath || !htmlFileUrl) {
        console.error('===== NO HTML FILE FOUND =====');
        console.error('Available files:', allFiles.map(f => f.path));
        throw new Error(`No se encontró archivo HTML ejecutable. Archivos disponibles: ${allFiles.map(f => f.path).join(', ')}`);
      }

      console.log(`===== PROCESSING HTML FILE: ${htmlFilePath} =====`);
      
      // Obtener el archivo HTML original
      const htmlFile = scormPackage.files.get(htmlFilePath);
      if (!htmlFile) {
        throw new Error(`No se pudo obtener el archivo HTML: ${htmlFilePath}`);
      }

      // Leer el contenido del archivo HTML
      const htmlContent = await htmlFile.text();
      console.log('===== ORIGINAL HTML CONTENT =====');
      console.log('Original HTML length:', htmlContent.length);
      console.log('First 200 chars:', htmlContent.substring(0, 200));
      
      if (htmlContent.length === 0) {
        throw new Error('El archivo HTML está vacío');
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
      console.log('First 200 chars:', rewrittenHtml.substring(0, 200));
      
      // Verificar que el HTML reescrito es válido
      if (rewrittenHtml.length === 0) {
        console.error('ERROR: Rewritten HTML is empty, using original');
        throw new Error('El HTML reescrito está vacío');
      }
      
      // Crear un nuevo blob con el HTML modificado
      console.log('===== CREATING FINAL BLOB URL =====');
      const rewrittenBlob = new Blob([rewrittenHtml], { 
        type: 'text/html;charset=utf-8' 
      });
      const rewrittenUrl = URL.createObjectURL(rewrittenBlob);
      
      // Validar la URL final
      try {
        const testUrl = new URL(rewrittenUrl);
        if (testUrl.protocol !== 'blob:') {
          throw new Error('URL final no es una URL blob válida');
        }
        console.log(`✓ Final rewritten URL is valid: ${rewrittenUrl}`);
      } catch (e) {
        console.error(`✗ Final rewritten URL is invalid: ${rewrittenUrl}`, e);
        throw new Error(`URL blob final inválida: ${rewrittenUrl}`);
      }
      
      console.log('===== SCORM CONTENT LOADING SUCCESS =====');
      setContentUrl(rewrittenUrl);

    } catch (err) {
      console.error('===== SCORM LOADING ERROR =====');
      console.error('Error details:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el contenido SCORM';
      console.error('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('===== SCORM CONTENT LOADING END =====');
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
