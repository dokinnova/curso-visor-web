
import React, { useEffect } from 'react';
import { SCORMPackage } from '@/types/scorm';
import { setupSCORMAPI } from '@/utils/scormAPI';
import { useCourseNavigation } from '@/hooks/useCourseNavigation';
import CourseHeader from './CourseHeader';
import CourseNavigation from './CourseNavigation';
import ContentArea from './ContentArea';

interface CourseViewerProps {
  course: SCORMPackage;
  onBack: () => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack }) => {
  const {
    currentItem,
    currentResource,
    refreshKey,
    selectItem,
    refreshContent
  } = useCourseNavigation(course);

  useEffect(() => {
    // Configurar la API SCORM cuando se monta el componente
    setupSCORMAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CourseHeader
        course={course}
        currentItem={currentItem}
        currentResource={currentResource}
        onBack={onBack}
        onRefresh={refreshContent}
      />

      <div className="flex-1 flex">
        <CourseNavigation
          course={course}
          currentItem={currentItem}
          onSelectItem={selectItem}
        />

        <div className="flex-1 p-6">
          <ContentArea
            currentItem={currentItem}
            currentResource={currentResource}
            scormPackage={course}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
