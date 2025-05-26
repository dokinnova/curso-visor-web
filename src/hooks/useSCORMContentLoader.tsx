
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
    
    try {
      if (virtualServerRef.current) {
        virtualServerRef.current.clear();
      }
      virtualServerRef.current = new VirtualFileServer();

      console.log('=== LOADING SCORM CONTENT ===');
      console.log('Resource to load:', resource);
      
      // Process all SCORM package files
      let htmlFilesProcessed = 0;
      for (const [path, file] of scormPackage.files.entries()) {
        console.log(`Processing file: ${path} (${file.size} bytes, ${file.type})`);
        
        if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
          console.log(`Injecting SCORM API into HTML file: ${path}`);
          try {
            const modifiedFile = await createModifiedBlob(file);
            virtualServerRef.current.addFile(path, modifiedFile);
            htmlFilesProcessed++;
          } catch (injectionError) {
            console.warn(`Failed to inject SCORM API into ${path}, using original:`, injectionError);
            virtualServerRef.current.addFile(path, file);
          }
        } else {
          virtualServerRef.current.addFile(path, file);
        }
      }

      console.log(`Processed ${htmlFilesProcessed} HTML files with SCORM API injection`);
      
      // Enhanced strategy to find main content
      let resolvedUrl: string | null = null;
      
      // 1. Try main resource href - clean the URL first
      if (resource.href) {
        console.log(`Trying main resource href: ${resource.href}`);
        // Remove query parameters like ?type=scorm
        const cleanHref = resource.href.split('?')[0];
        console.log(`Clean href: ${cleanHref}`);
        resolvedUrl = virtualServerRef.current.resolveUrl(cleanHref);
        if (resolvedUrl) {
          console.log(`SUCCESS: Found content using main href: ${cleanHref}`);
        }
      }

      // 2. Try resource files
      if (!resolvedUrl && resource.files.length > 0) {
        console.log('Main href not found, trying resource files...');
        
        for (const resourceFile of resource.files) {
          console.log(`Trying resource file: ${resourceFile}`);
          resolvedUrl = virtualServerRef.current.resolveUrl(resourceFile);
          if (resolvedUrl) {
            console.log(`SUCCESS: Found content using resource file: ${resourceFile}`);
            break;
          }
        }
      }

      // 3. Search for common SCORM entry points
      if (!resolvedUrl) {
        console.log('No specific resource file found, searching for SCORM entry points...');
        const scormEntryPoints = [
          'index.html', 'index.htm',
          'course/index.html', 'course/index.htm',
          'content/index.html', 'content/index.htm',
          'default.html', 'default.htm',
          'main.html', 'main.htm',
          'start.html', 'start.htm',
          'launch.html', 'launch.htm'
        ];

        for (const entryPoint of scormEntryPoints) {
          resolvedUrl = virtualServerRef.current.resolveUrl(entryPoint);
          if (resolvedUrl) {
            console.log(`SUCCESS: Found SCORM entry point: ${entryPoint}`);
            break;
          }
        }
      }

      // 4. Fallback to any HTML file
      if (!resolvedUrl) {
        console.log('Using fallback: searching for any HTML file...');
        const allFiles = virtualServerRef.current.getAllFiles();
        const htmlFiles = allFiles.filter(f => 
          f.mimeType === 'text/html' || 
          f.path.toLowerCase().endsWith('.html') || 
          f.path.toLowerCase().endsWith('.htm')
        );

        console.log(`Found ${htmlFiles.length} HTML files:`, htmlFiles.map(f => f.path));

        if (htmlFiles.length > 0) {
          // Prioritize main entry files
          const prioritizedFile = htmlFiles.find(f => 
            ['index', 'main', 'start', 'launch', 'content'].some(name => 
              f.path.toLowerCase().includes(name)
            )
          ) || htmlFiles[0];
          
          console.log(`Using HTML file: ${prioritizedFile.path}`);
          setContentUrl(prioritizedFile.url);
        } else {
          throw new Error(`No se encontraron archivos HTML ejecutables en el paquete SCORM. Archivos disponibles: ${allFiles.map(f => f.path).join(', ')}`);
        }
      } else {
        setContentUrl(resolvedUrl);
      }

      console.log(`Final content URL set: ${contentUrl || resolvedUrl}`);

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
