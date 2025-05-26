
import { useState, useEffect } from 'react';
import { SCORMPackage, Item, Resource } from '@/types/scorm';

export const useCourseNavigation = (course: SCORMPackage) => {
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Debug: mostrar información del curso
    console.log('SCORM Course loaded:');
    console.log('- Title:', course.manifest.title);
    console.log('- Organizations:', course.manifest.organizations.length);
    console.log('- Resources:', course.manifest.resources.length);
    console.log('- Files:', course.files.size);
    
    // Mostrar todos los archivos disponibles
    console.log('Available files in SCORM package:');
    course.files.forEach((file, path) => {
      console.log(`  ${path} (${file.size} bytes, ${file.type})`);
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
      } else {
        console.error('Resource not found for identifier:', item.identifierref);
        setCurrentResource(null);
      }
    } else {
      setCurrentResource(null);
    }
  };

  const refreshContent = () => {
    setRefreshKey(prev => prev + 1);
  };

  return {
    currentItem,
    currentResource,
    refreshKey,
    selectItem,
    refreshContent
  };
};
