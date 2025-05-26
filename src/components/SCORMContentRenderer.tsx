
import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SCORMPackage, Resource } from '@/types/scorm';
import VirtualFileServer from '@/utils/virtualFileServer';

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
      // Limpiar el servidor virtual al desmontar
      if (virtualServerRef.current) {
        virtualServerRef.current.clear();
      }
    };
  }, [resource, scormPackage]);

  const loadContent = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Crear nuevo servidor virtual
      if (virtualServerRef.current) {
        virtualServerRef.current.clear();
      }
      virtualServerRef.current = new VirtualFileServer();

      // Agregar todos los archivos al servidor virtual
      console.log('Setting up virtual file server...');
      scormPackage.files.forEach((file, path) => {
        virtualServerRef.current!.addFile(path, file);
      });

      // Mostrar archivos disponibles
      console.log('Available files in virtual server:');
      virtualServerRef.current.getAllFiles().forEach(({ path, url }) => {
        console.log(`  ${path} -> ${url}`);
      });

      // Resolver la URL del recurso
      const resolvedUrl = virtualServerRef.current.resolveUrl(resource.href);
      
      if (resolvedUrl) {
        console.log(`Loading content from resolved URL: ${resolvedUrl}`);
        setContentUrl(resolvedUrl);
      } else {
        // Fallback: buscar cualquier archivo HTML
        console.log('Main resource not found, looking for HTML fallback...');
        const htmlFiles = Array.from(scormPackage.files.keys()).filter(path => 
          path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')
        );

        if (htmlFiles.length > 0) {
          const fallbackUrl = virtualServerRef.current.resolveUrl(htmlFiles[0]);
          if (fallbackUrl) {
            console.log(`Using HTML fallback: ${htmlFiles[0]} -> ${fallbackUrl}`);
            setContentUrl(fallbackUrl);
          } else {
            throw new Error(`No se pudo cargar el archivo de respaldo: ${htmlFiles[0]}`);
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
    
    // Agregar listener para errores dentro del iframe
    if (iframeRef.current) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          iframeWindow.addEventListener('error', (event) => {
            console.error('Error inside iframe:', event.error);
            setError(`Error en el contenido: ${event.error?.message || 'Error desconocido'}`);
          });
        }
      } catch (e) {
        // Ignorar errores de CORS al acceder al iframe
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
          <p className="text-gray-600">Cargando contenido...</p>
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
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    />
  );
};

export default SCORMContentRenderer;
