
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
  console.log('=== RENDERIZANDO NAVEGACIÓN ===');
  console.log('Curso recibido:', course?.manifest?.title);
  console.log('Organizaciones:', course?.manifest?.organizations?.length || 0);
  
  if (!course?.manifest?.organizations || course.manifest.organizations.length === 0) {
    console.warn('No hay organizaciones para mostrar');
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
          </div>
        </div>
      </div>
    );
  }

  const renderNavigationItem = (item: Item, level: number = 0) => {
    console.log(`Renderizando item: ${item.title} (nivel ${level})`);
    
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

  return (
    <div className="w-80 bg-white border-r shadow-sm">
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <Home className="h-5 w-5 mr-2" />
          Contenido del Curso
        </h2>
        <Separator className="mb-4" />
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          {course.manifest.organizations.map((org, orgIndex) => (
            <div key={org.identifier} className="space-y-2 mb-6">
              <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                {org.title}
              </h3>
              <div className="text-xs text-gray-500 mb-2">
                {org.items.length} elemento(s)
              </div>
              {org.items.length === 0 ? (
                <div className="text-sm text-gray-400 italic">
                  No hay items en esta organización
                </div>
              ) : (
                org.items.map(item => renderNavigationItem(item))
              )}
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

export default CourseNavigation;
