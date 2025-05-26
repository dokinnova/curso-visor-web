
import React from 'react';

const SCORMLoadingDisplay: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando contenido SCORM...</p>
        <p className="text-sm text-gray-500 mt-2">Analizando archivos del paquete...</p>
      </div>
    </div>
  );
};

export default SCORMLoadingDisplay;
