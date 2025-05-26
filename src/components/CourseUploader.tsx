
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SCORMPackage } from '@/types/scorm';
import { parseSCORMPackage } from '@/utils/scormParser';

interface CourseUploaderProps {
  onCourseLoaded: (course: SCORMPackage) => void;
}

const CourseUploader: React.FC<CourseUploaderProps> = ({ onCourseLoaded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Por favor, selecciona un archivo ZIP que contenga un curso SCORM');
      return;
    }

    setError(null);
    setSuccess(false);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      console.log('Processing SCORM package:', file.name);
      
      // Simular progreso de procesamiento
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const scormPackage = await parseSCORMPackage(file);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setTimeout(() => {
        setIsProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          onCourseLoaded(scormPackage);
        }, 1000);
      }, 500);

    } catch (err) {
      console.error('Error processing SCORM package:', err);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar el archivo');
    }
  }, [onCourseLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip']
    },
    multiple: false
  });

  return (
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Cargar Curso SCORM</h2>
          <p className="text-gray-600">
            Selecciona un archivo ZIP que contenga un paquete SCORM o xAPI
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              ¡Curso cargado exitosamente! Abriendo visualizador...
            </AlertDescription>
          </Alert>
        )}

        {isProcessing ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Procesando curso SCORM...</p>
            </div>
            <Progress value={processingProgress} className="w-full" />
            <p className="text-sm text-gray-500 text-center">
              {processingProgress < 30 && 'Extrayendo archivos...'}
              {processingProgress >= 30 && processingProgress < 60 && 'Analizando manifiesto...'}
              {processingProgress >= 60 && processingProgress < 90 && 'Validando contenido...'}
              {processingProgress >= 90 && 'Finalizando...'}
            </p>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <Upload className="h-8 w-8 text-blue-600 animate-bounce" />
                ) : (
                  <File className="h-8 w-8 text-blue-600" />
                )}
              </div>
              
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">
                  ¡Suelta el archivo aquí!
                </p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Arrastra un archivo ZIP aquí, o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-gray-500">
                    Archivos soportados: .zip (paquetes SCORM)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Los archivos se procesan localmente en tu navegador. No se envían a ningún servidor.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseUploader;
