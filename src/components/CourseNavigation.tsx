
import React from 'react';
import { ChevronRight, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SCORMPackage, Item } from '@/types/scorm';

interface CourseNavigationProps {
  course: SCORMPackage;
  currentItem: Item | null;
  onSelectItem: (item: Item) => void;
}

const CourseNavigation: React.FC<CourseNavigationProps> = ({
  course,
  currentItem,
  onSelectItem
}) => {
  console.log('=== RENDERIZANDO NAVEGACIÓN - DEBUG COMPLETO ===');
  console.log('Curso completo recibido:', course);
  console.log('Manifest:', course?.manifest);
  console.log('Título del curso:', course?.manifest?.title);
  console.log('Organizaciones completas:', course?.manifest?.organizations);
  console.log('Número de organizaciones:', course?.manifest?.organizations?.length || 0);
  
  // Debug cada organización individualmente
  if (course?.manifest?.organizations) {
    course.manifest.organizations.forEach((org, index) => {
      console.log(`=== ORGANIZACIÓN ${index + 1} ===`);
      console.log('ID:', org.identifier);
      console.log('Título:', org.title);
      console.log('Items:', org.items);
      console.log('Número de items:', org.items?.length || 0);
      
      if (org.items && org.items.length > 0) {
        org.items.forEach((item, itemIndex) => {
          console.log(`  Item ${itemIndex + 1}:`, item);
        });
      }
    });
  }
  
  if (!course?.manifest?.organizations || course.manifest.organizations.length === 0) {
    console.warn('No hay organizaciones para mostrar - mostrando mensaje de error');
    return (
      <div className="w-80 bg-white border-r shadow-sm">
        <div className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Contenido del Curso
          </h2>
          <Separator className="mb-4" />
          <div className="text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>No se encontraron temas</p>
            <p className="text-sm">Revisa el archivo SCORM</p>
            <p className="text-xs mt-2 text-red-500">
              Debug: {course?.manifest ? 'Manifest existe' : 'No hay manifest'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderNavigationItem = (item: Item, level: number = 0) => {
    console.log(`Renderizando item: ${item.title} (nivel ${level}, ID: ${item.identifier})`);
    
    const isSelected = currentItem?.identifier === item.identifier;
    const hasContent = !!item.identifierref;

    return (
      <div key={item.identifier}>
        <Button
          variant={isSelected ? "default" : "ghost"}
          className={`w-full justify-start text-left mb-1 ${
            level > 0 ? `ml-${level * 4}` : ''
          }`}
          onClick={() => {
            console.log('Seleccionando item:', item.title, 'Ref:', item.identifierref);
            if (hasContent) {
              onSelectItem(item);
            }
          }}
          disabled={!hasContent}
        >
          <div className="flex items-center space-x-2 truncate">
            {hasContent && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            <span className="truncate">{item.title}</span>
            {!hasContent && <span className="text-xs text-gray-400">(sin contenido)</span>}
          </div>
        </Button>
        
        {item.children && item.children.map(child => 
          renderNavigationItem(child, level + 1)
        )}
      </div>
    );
  };

  console.log('=== RENDERIZANDO INTERFAZ DE NAVEGACIÓN ===');

  return (
    <div className="w-80 bg-white border-r shadow-sm">
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <Home className="h-5 w-5 mr-2" />
          Contenido del Curso
        </h2>
        <Separator className="mb-4" />
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          {course.manifest.organizations.map((org, orgIndex) => {
            console.log(`Renderizando organización ${orgIndex + 1}: ${org.title}`);
            return (
              <div key={org.identifier} className="space-y-2 mb-6">
                <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                  {org.title}
                </h3>
                <div className="text-xs text-gray-500 mb-2">
                  {org.items?.length || 0} elemento(s)
                </div>
                {!org.items || org.items.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">
                    No hay items en esta organización
                  </div>
                ) : (
                  org.items.map(item => {
                    console.log('Mapeando item para render:', item);
                    return renderNavigationItem(item);
                  })
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
};

export default CourseNavigation;
