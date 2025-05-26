
import { useState, useEffect, useRef } from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';
import { SimpleFileServer } from '@/utils/fileServerSimple';

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

      console.log('=== SIMPLE SCORM LOADING ===');
      console.log('Resource:', resource);
      
      // Agregar todos los archivos al servidor simple
      for (const [path, file] of scormPackage.files.entries()) {
        fileServerRef.current.addFile(path, file);
      }

      let finalUrl: string | null = null;

      // Estrategia 1: Usar el href del resource si existe
      if (resource.href) {
        console.log(`Trying resource href: ${resource.href}`);
        finalUrl = fileServerRef.current.getFileUrl(resource.href);
        if (finalUrl) {
          console.log(`SUCCESS: Using resource href ${resource.href}`);
        }
      }

      // Estrategia 2: Buscar en los archivos del resource
      if (!finalUrl && resource.files && resource.files.length > 0) {
        console.log('Trying resource files:', resource.files);
        
        for (const fileName of resource.files) {
          if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
            finalUrl = fileServerRef.current.getFileUrl(fileName);
            if (finalUrl) {
              console.log(`SUCCESS: Using resource file ${fileName}`);
              break;
            }
          }
        }
      }

      // Estrategia 3: Buscar archivo principal común
      if (!finalUrl) {
        console.log('Searching for main entry file...');
        finalUrl = fileServerRef.current.findMainFile();
        if (finalUrl) {
          console.log('SUCCESS: Found main entry file');
        }
      }

      if (finalUrl) {
        console.log(`Final URL: ${finalUrl}`);
        setContentUrl(finalUrl);
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
