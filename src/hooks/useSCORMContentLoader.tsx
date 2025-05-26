
import { useState, useEffect, useRef } from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';
import VirtualFileServer from '@/utils/virtualFileServer';
import { createModifiedBlob } from '@/utils/scormInjector';

export const useSCORMContentLoader = (resource: Resource, scormPackage: SCORMPackage) => {
  const [contentUrl, setContentUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const virtualServerRef = useRef<VirtualFileServer | null>(null);

  useEffect(() => {
    loadContent();
    return () => {
      if (virtualServerRef.current) {
        virtualServerRef.current.clear();
      }
    };
  }, [resource, scormPackage]);

  const loadContent = async () => {
    setIsLoading(true);
    setError('');
    setContentUrl('');
    
    try {
      if (virtualServerRef.current) {
        virtualServerRef.current.clear();
      }
      virtualServerRef.current = new VirtualFileServer();

      console.log('=== SIMPLE SCORM LOADING ===');
      console.log('Resource:', resource);
      
      // Process files first
      const filePromises: Promise<void>[] = [];
      
      for (const [path, file] of scormPackage.files.entries()) {
        if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
          console.log(`Processing HTML file: ${path}`);
          filePromises.push(
            createModifiedBlob(file).then(modifiedFile => {
              virtualServerRef.current!.addFile(path, modifiedFile);
            }).catch(injectionError => {
              console.warn(`Using original HTML file ${path}:`, injectionError);
              virtualServerRef.current!.addFile(path, file);
            })
          );
        } else {
          virtualServerRef.current.addFile(path, file);
        }
      }

      await Promise.all(filePromises);
      
      // Strategy 1: Try resource files directly (most reliable)
      let finalUrl: string | null = null;
      
      if (resource.files && resource.files.length > 0) {
        console.log('Trying resource files:', resource.files);
        
        // Look for HTML files in resource files list
        const htmlFiles = resource.files.filter(f => 
          f.toLowerCase().endsWith('.html') || f.toLowerCase().endsWith('.htm')
        );
        
        for (const htmlFile of htmlFiles) {
          finalUrl = virtualServerRef.current.resolveUrl(htmlFile);
          if (finalUrl) {
            console.log(`SUCCESS: Using resource file ${htmlFile}`);
            break;
          }
        }
      }
      
      // Strategy 2: If no HTML in resource files, try common entry points
      if (!finalUrl) {
        console.log('No HTML in resource files, searching for entry points...');
        const entryPoints = [
          'index.html', 'index.htm',
          'main.html', 'main.htm', 
          'start.html', 'start.htm',
          'launch.html', 'launch.htm',
          'default.html', 'default.htm'
        ];

        for (const entry of entryPoints) {
          finalUrl = virtualServerRef.current.resolveUrl(entry);
          if (finalUrl) {
            console.log(`SUCCESS: Found entry point ${entry}`);
            break;
          }
        }
      }
      
      // Strategy 3: Use any HTML file available
      if (!finalUrl) {
        console.log('Using any available HTML file...');
        const allFiles = virtualServerRef.current.getAllFiles();
        const htmlFile = allFiles.find(f => 
          f.mimeType === 'text/html' || 
          f.path.toLowerCase().endsWith('.html') ||
          f.path.toLowerCase().endsWith('.htm')
        );
        
        if (htmlFile) {
          finalUrl = htmlFile.url;
          console.log(`SUCCESS: Using HTML file ${htmlFile.path}`);
        }
      }

      if (finalUrl) {
        console.log(`Final URL set: ${finalUrl}`);
        setContentUrl(finalUrl);
      } else {
        const allFiles = virtualServerRef.current.getAllFiles();
        console.error('Available files:', allFiles.map(f => f.path));
        throw new Error(`No se encontró contenido HTML ejecutable. Archivos disponibles: ${allFiles.map(f => f.path).join(', ')}`);
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
