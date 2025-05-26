import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SCORMPackage, Item, Resource } from '@/types/scorm';
import { setupSCORMAPI } from '@/utils/scormAPI';

interface CourseViewerProps {
  course: SCORMPackage;
  onBack: () => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack }) => {
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [contentUrl, setContentUrl] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Configurar la API SCORM cuando se monta el componente
    setupSCORMAPI();
    
    // Debug: mostrar todos los archivos disponibles
    console.log('Available files in SCORM package:');
    course.files.forEach((file, path) => {
      console.log('- ', path);
    });
    
    // Seleccionar el primer item automáticamente
    if (course.manifest.organizations.length > 0) {
      const firstOrg = course.manifest.organizations[0];
      if (firstOrg.items.length > 0) {
        selectItem(firstOrg.items[0]);
      }
    }
  }, [course]);

  const selectItem = (item: Item) => {
    console.log('Selecting item:', item);
    setCurrentItem(item);

    if (item.identifierref) {
      const resource = course.manifest.resources.find(r => r.identifier === item.identifierref);
      if (resource) {
        console.log('Found resource:', resource);
        setCurrentResource(resource);
        loadContent(resource);
      } else {
        console.error('Resource not found for identifier:', item.identifierref);
      }
    }
  };

  const loadContent = async (resource: Resource) => {
    if (!resource.href) {
      console.warn('Resource has no href:', resource);
      return;
    }

    console.log('Attempting to load resource with href:', resource.href);

    // Separar el archivo base de los query parameters
    const [baseHref] = resource.href.split('?');
    console.log('Base href:', baseHref);

    // Buscar el archivo por nombre base primero
    let file = course.files.get(resource.href);
    
    if (!file) {
      // Si no se encuentra con query parameters, buscar sin ellos
      file = course.files.get(baseHref);
      console.log('Looking for file without query params:', baseHref);
    }

    if (!file) {
      // Buscar archivos que contengan el nombre base
      const matchingFiles = Array.from(course.files.keys()).filter(path => 
        path.includes(baseHref) || baseHref.includes(path.split('/').pop() || '')
      );
      console.log('Matching files found:', matchingFiles);
      
      if (matchingFiles.length > 0) {
        file = course.files.get(matchingFiles[0]);
        console.log('Using matching file:', matchingFiles[0]);
      }
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setContentUrl(url);
      console.log('Loading content from:', url);
    } else {
      console.error('File not found. Available files:');
      course.files.forEach((_, path) => console.log('  ', path));
      console.error('Searched for:', resource.href, 'and', baseHref);
      
      // Intentar cargar el primer archivo HTML disponible como fallback
      const htmlFiles = Array.from(course.files.keys()).filter(path => 
        path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')
      );
      
      if (htmlFiles.length > 0) {
        console.log('Using fallback HTML file:', htmlFiles[0]);
        const fallbackFile = course.files.get(htmlFiles[0]);
        if (fallbackFile) {
          const url = URL.createObjectURL(fallbackFile);
          setContentUrl(url);
        }
      }
    }
  };

  const renderNavigationItem = (item: Item, level: number = 0) => {
    const isSelected = currentItem?.identifier === item.identifier;
    const hasContent = !!item.identifierref;

    return (
      <div key={item.identifier}>
        <Button
          variant={isSelected ? "default" : "ghost"}
          className={`w-full justify-start text-left mb-1 ${
            level > 0 ? `ml-${level * 4}` : ''
          }`}
          onClick={() => hasContent && selectItem(item)}
          disabled={!hasContent}
        >
          <div className="flex items-center space-x-2 truncate">
            {hasContent && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <span className="truncate">{item.title}</span>
          </div>
        </Button>
        
        {item.children && item.children.map(child => 
          renderNavigationItem(child, level + 1)
        )}
      </div>
    );
  };

  const resetContent = () => {
    if (currentResource) {
      loadContent(currentResource);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold">{course.manifest.title}</h1>
                  {course.manifest.description && (
                    <p className="text-sm text-gray-600">{course.manifest.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            {currentItem && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={resetContent}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-white border-r shadow-sm">
          <div className="p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Contenido del Curso
            </h2>
            <Separator className="mb-4" />
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              {course.manifest.organizations.map(org => (
                <div key={org.identifier} className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                    {org.title}
                  </h3>
                  {org.items.map(item => renderNavigationItem(item))}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {currentItem && contentUrl ? (
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <span>{currentItem.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <iframe
                  ref={iframeRef}
                  src={contentUrl}
                  className="w-full h-full border-0 rounded-b-lg"
                  title={currentItem.title}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Selecciona un elemento del curso
                </h3>
                <p className="text-gray-500">
                  Usa la navegación de la izquierda para explorar el contenido del curso
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
