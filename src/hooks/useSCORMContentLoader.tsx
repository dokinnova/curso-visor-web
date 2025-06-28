
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
    console.log('[SCORM Loader] Direct file serving approach');
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      // Buscar el archivo HTML directamente
      let htmlFile: File | undefined;
      let htmlPath = '';

      if (resource.href) {
        htmlFile = scormPackage.files.get(resource.href);
        htmlPath = resource.href;
      }

      if (!htmlFile) {
        // Buscar index.html o cualquier HTML
        for (const [path, file] of scormPackage.files.entries()) {
          if (path.toLowerCase().includes('index.html') || path.toLowerCase().endsWith('.html')) {
            htmlFile = file;
            htmlPath = path;
            break;
          }
        }
      }

      if (!htmlFile) {
        throw new Error('No se encontró archivo HTML');
      }

      console.log(`[SCORM Loader] Usando archivo: ${htmlPath}`);
      
      // Crear URL directamente del archivo sin modificaciones
      const directUrl = URL.createObjectURL(htmlFile);
      
      console.log('[SCORM Loader] ✓ URL creada directamente');
      setContentUrl(directUrl);

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
