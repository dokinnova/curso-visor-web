
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
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
          onClick={() => hasContent && onSelectItem(item)}
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

  return (
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
  );
};

export default CourseNavigation;
