
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SCORMErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

const SCORMErrorDisplay: React.FC<SCORMErrorDisplayProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Alert className="mb-4 border-red-200 bg-red-50 max-w-md">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reintentar
      </Button>
    </div>
  );
};

export default SCORMErrorDisplay;
