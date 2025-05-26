
import React, { useState } from 'react';
import { Upload, BookOpen, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CourseUploader from '@/components/CourseUploader';
import CourseViewer from '@/components/CourseViewer';
import { SCORMPackage } from '@/types/scorm';

const Index = () => {
  const [loadedCourse, setLoadedCourse] = useState<SCORMPackage | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'viewer'>('upload');

  const handleCourseLoaded = (course: SCORMPackage) => {
    console.log('Course loaded:', course);
    setLoadedCourse(course);
    setCurrentView('viewer');
  };

  const handleBackToUpload = () => {
    setCurrentView('upload');
    setLoadedCourse(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {currentView === 'upload' && (
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full mr-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Visualizador SCORM & xAPI
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma moderna para cargar y visualizar cursos de formación online compatibles con estándares SCORM y xAPI
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Carga Fácil</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Arrastra y suelta archivos ZIP de cursos SCORM o selecciona desde tu dispositivo
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Play className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-lg">Reproducción Inmediata</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visualiza el contenido del curso directamente en el navegador sin instalaciones
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg">Estándares Compatibles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Soporte completo para SCORM 1.2, SCORM 2004 y xAPI (Tin Can API)
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Course Uploader */}
          <div className="max-w-2xl mx-auto">
            <CourseUploader onCourseLoaded={handleCourseLoaded} />
          </div>
        </div>
      )}

      {currentView === 'viewer' && loadedCourse && (
        <CourseViewer 
          course={loadedCourse} 
          onBack={handleBackToUpload}
        />
      )}
    </div>
  );
};

export default Index;
