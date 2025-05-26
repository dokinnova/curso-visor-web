
import React from 'react';
import { ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCORMPackage, Item, Resource } from '@/types/scorm';

interface CourseHeaderProps {
  course: SCORMPackage;
  currentItem: Item | null;
  currentResource: Resource | null;
  onBack: () => void;
  onRefresh: () => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  currentItem,
  currentResource,
  onBack,
  onRefresh
}) => {
  return (
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
          
          {currentItem && currentResource && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Recargar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
