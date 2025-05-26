
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

      console.log('=== LOADING SCORM 1.2 CONTENT ===');
      console.log('Resource to load:', resource);
      
      // Process all SCORM package files
      let htmlFilesProcessed = 0;
      for (const [path, file] of scormPackage.files.entries()) {
        console.log(`Processing file: ${path} (${file.size} bytes, ${file.type})`);
        
        if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
          console.log(`Injecting SCORM 1.2 API into HTML file: ${path}`);
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

      console.log(`Processed ${htmlFilesProcessed} HTML files with SCORM 1.2 API injection`);
      
      // Enhanced strategy to find main content
      let resolvedUrl: string | null = null;
      
      // 1. Try main resource href
      if (resource.href) {
        console.log(`Trying main resource href: ${resource.href}`);
        resolvedUrl = virtualServerRef.current.resolveUrl(resource.href);
        if (resolvedUrl) {
          console.log(`SUCCESS: Found content using main href: ${resource.href}`);
        }
      }

      // 2. Try resource files
      if (!resolvedUrl && resource.files.length > 0) {
        console.log('Main href not found, trying resource files...');
        
        const htmlFiles = resource.files.filter(f => 
          f.toLowerCase().endsWith('.html') || f.toLowerCase().endsWith('.htm')
        );
        
        const filesToTry = htmlFiles.length > 0 ? htmlFiles : resource.files;
        
        for (const resourceFile of filesToTry) {
          console.log(`Trying resource file: ${resourceFile}`);
          resolvedUrl = virtualServerRef.current.resolveUrl(resourceFile);
          if (resolvedUrl) {
            console.log(`SUCCESS: Found content using resource file: ${resourceFile}`);
            break;
          }
        }
      }

      // 3. Search for SCORM 1.2 common entry points
      if (!resolvedUrl) {
        console.log('No specific resource file found, searching for SCORM 1.2 entry points...');
        const scorm12EntryPoints = [
          'index.html', 'index.htm',
          'default.html', 'default.htm',
          'main.html', 'main.htm',
          'start.html', 'start.htm',
          'launch.html', 'launch.htm',
          'content.html', 'content.htm',
          'lesson.html', 'lesson.htm',
          'course.html', 'course.htm'
        ];

        for (const entryPoint of scorm12EntryPoints) {
          resolvedUrl = virtualServerRef.current.resolveUrl(entryPoint);
          if (resolvedUrl) {
            console.log(`SUCCESS: Found SCORM 1.2 entry point: ${entryPoint}`);
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
          const prioritizedFile = htmlFiles.find(f => 
            ['index', 'main', 'start', 'launch', 'content'].some(name => 
              f.path.toLowerCase().includes(name)
            )
          ) || htmlFiles[0];
          
          console.log(`Using HTML file: ${prioritizedFile.path}`);
          setContentUrl(prioritizedFile.url);
        } else {
          throw new Error(`No se encontraron archivos HTML ejecutables en el paquete SCORM 1.2. Archivos disponibles: ${allFiles.map(f => f.path).join(', ')}`);
        }
      } else {
        setContentUrl(resolvedUrl);
      }

    } catch (err) {
      console.error('Error loading SCORM 1.2 content:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el contenido SCORM 1.2');
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
