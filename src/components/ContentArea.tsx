
import React from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SCORMPackage, Item, Resource } from '@/types/scorm';
import SCORMContentRenderer from './SCORMContentRenderer';

interface ContentAreaProps {
  currentItem: Item | null;
  currentResource: Resource | null;
  scormPackage: SCORMPackage;
  refreshKey: number;
}

const ContentArea: React.FC<ContentAreaProps> = ({
  currentItem,
  currentResource,
  scormPackage,
  refreshKey
}) => {
  if (currentItem && currentResource) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <span>{currentItem.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-80px)]">
          <SCORMContentRenderer
            key={`${currentResource.identifier}-${refreshKey}`}
            resource={currentResource}
            scormPackage={scormPackage}
            title={currentItem.title}
          />
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
};

export default ContentArea;
