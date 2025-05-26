
import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SCORMPackage, Resource } from '@/types/scorm';
import VirtualFileServer from '@/utils/virtualFileServer';
import { createModifiedBlob } from '@/utils/scormInjector';

interface SCORMContentRendererProps {
  resource: Resource;
  scormPackage: SCORMPackage;
  title: string;
}

const SCORMContentRenderer: React.FC<SCORMContentRendererProps> = ({
  resource,
  scormPackage,
  title
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
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
      
      // Procesar todos los archivos del paquete SCORM
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
      
      // Estrategia mejorada para encontrar el contenido principal
      let resolvedUrl: string | null = null;
      
      // 1. Intentar con el href del recurso
      if (resource.href) {
        console.log(`Trying main resource href: ${resource.href}`);
        resolvedUrl = virtualServerRef.current.resolveUrl(resource.href);
        if (resolvedUrl) {
          console.log(`SUCCESS: Found content using main href: ${resource.href}`);
        }
      }

      // 2. Intentar con los archivos del recurso
      if (!resolvedUrl && resource.files.length > 0) {
        console.log('Main href not found, trying resource files...');
        
        // Priorizar archivos HTML
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

      // 3. Buscar archivos de entrada comunes para SCORM 1.2
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

      // 4. Como último recurso, usar cualquier archivo HTML disponible
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
          // Priorizar archivos con nombres comunes
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

  const handleIframeLoad = () => {
    console.log('SCORM 1.2 iframe loaded successfully');
    setIsLoading(false);
    
    // Mejorar la comunicación con el iframe para SCORM 1.2
    if (iframeRef.current) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          setTimeout(() => {
            try {
              if ((iframeWindow as any).API) {
                console.log('SCORM 1.2 API detected in iframe');
                // Inicializar la sesión SCORM automáticamente
                const initResult = (iframeWindow as any).API.LMSInitialize('');
                console.log('SCORM 1.2 auto-initialization result:', initResult);
              } else {
                console.warn('SCORM 1.2 API not found in iframe');
              }
            } catch (e) {
              console.log('Cannot access iframe content due to CORS restrictions');
            }
          }, 1000);
        }
      } catch (e) {
        console.log('Cannot access iframe content (CORS)');
      }
    }
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
    setError('Error al cargar el contenido del curso');
    setIsLoading(false);
  };

  const retry = () => {
    loadContent();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Alert className="mb-4 border-red-200 bg-red-50 max-w-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={retry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading || !contentUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contenido SCORM...</p>
          <p className="text-sm text-gray-500 mt-2">Analizando archivos del paquete...</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={contentUrl}
      className="w-full h-full border-0 rounded-b-lg"
      title={title}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    />
  );
};

export default SCORMContentRenderer;
