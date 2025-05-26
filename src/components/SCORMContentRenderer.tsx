
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

      console.log('Setting up virtual file server with SCORM API injection...');
      console.log('Resource to load:', resource);
      
      // Agregar archivos al servidor virtual, inyectando API SCORM en archivos HTML
      for (const [path, file] of scormPackage.files.entries()) {
        if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
          console.log(`Injecting SCORM API into HTML file: ${path}`);
          try {
            const modifiedFile = await createModifiedBlob(file);
            virtualServerRef.current.addFile(path, modifiedFile);
          } catch (injectionError) {
            console.warn(`Failed to inject SCORM API into ${path}, using original:`, injectionError);
            virtualServerRef.current.addFile(path, file);
          }
        } else {
          virtualServerRef.current.addFile(path, file);
        }
      }

      console.log('Available files in virtual server:');
      virtualServerRef.current.getAllFiles().forEach(({ path, url }) => {
        console.log(`  ${path} -> ${url}`);
      });

      // Intentar resolver la URL del recurso principal
      let resolvedUrl = virtualServerRef.current.resolveUrl(resource.href);
      
      if (!resolvedUrl) {
        console.log('Main resource not found, searching for alternative entry points...');
        
        // Lista de posibles puntos de entrada
        const entryPoints = [
          'index.html',
          'main.html', 
          'start.html',
          'launch.html',
          'default.html',
          // También buscar archivos listados en el recurso
          ...resource.files.filter(f => f.toLowerCase().endsWith('.html'))
        ];
        
        for (const entryPoint of entryPoints) {
          resolvedUrl = virtualServerRef.current.resolveUrl(entryPoint);
          if (resolvedUrl) {
            console.log(`Found entry point: ${entryPoint} -> ${resolvedUrl}`);
            break;
          }
        }
      }
      
      if (resolvedUrl) {
        console.log(`Loading content from resolved URL: ${resolvedUrl}`);
        setContentUrl(resolvedUrl);
      } else {
        // Como último recurso, usar cualquier archivo HTML disponible
        const htmlFiles = Array.from(scormPackage.files.keys()).filter(path => 
          path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')
        );

        if (htmlFiles.length > 0) {
          const fallbackUrl = virtualServerRef.current.resolveUrl(htmlFiles[0]);
          if (fallbackUrl) {
            console.log(`Using HTML fallback: ${htmlFiles[0]} -> ${fallbackUrl}`);
            setContentUrl(fallbackUrl);
          } else {
            throw new Error(`No se pudo cargar ningún archivo HTML del paquete SCORM`);
          }
        } else {
          throw new Error('No se encontraron archivos HTML en el paquete SCORM');
        }
      }

    } catch (err) {
      console.error('Error loading SCORM content:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el contenido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIsLoading(false);
    
    // Intentar establecer comunicación con el iframe
    if (iframeRef.current) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          // Verificar si la API SCORM está disponible
          setTimeout(() => {
            try {
              if ((iframeWindow as any).API) {
                console.log('SCORM API detected in iframe');
              } else {
                console.warn('SCORM API not found in iframe');
              }
            } catch (e) {
              console.log('Cannot access iframe content due to CORS restrictions');
            }
          }, 1000);
          
          iframeWindow.addEventListener('error', (event) => {
            console.error('Error inside iframe:', event.error);
            setError(`Error en el contenido: ${event.error?.message || 'Error desconocido'}`);
          });
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
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads allow-top-navigation-by-user-activation"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    />
  );
};

export default SCORMContentRenderer;
