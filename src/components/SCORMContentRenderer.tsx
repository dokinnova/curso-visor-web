
import React from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';
import { useSCORMContentLoader } from '@/hooks/useSCORMContentLoader';
import SCORMErrorDisplay from './SCORMErrorDisplay';
import SCORMLoadingDisplay from './SCORMLoadingDisplay';

interface SCORMContentRendererProps {
  resource: Resource;
  scormPackage: SCORMPackage;
  title: string;
}

const SCORMContentRenderer: React.FC<SCORMContentRendererProps> = ({
  resource,
  scormPackage,
  title
}) => {
  const { contentUrl, error, isLoading, retry } = useSCORMContentLoader(resource, scormPackage);

  console.log('=== SCORM RENDERER ===');
  console.log('Content URL:', contentUrl);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  if (error) {
    return <SCORMErrorDisplay error={error} onRetry={retry} />;
  }

  if (isLoading || !contentUrl) {
    return <SCORMLoadingDisplay />;
  }

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-sm">
      <iframe
        src={contentUrl}
        className="w-full h-full border-0"
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads allow-top-navigation-by-user-activation"
        allow="fullscreen"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          border: 'none',
          display: 'block'
        }}
        onLoad={() => {
          console.log('Iframe loaded successfully');
          console.log('Iframe src:', contentUrl);
        }}
        onError={(e) => {
          console.error('Iframe failed to load:', e);
        }}
      />
    </div>
  );
};

export default SCORMContentRenderer;
