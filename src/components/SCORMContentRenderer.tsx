
import React from 'react';
import { SCORMPackage, Resource } from '@/types/scorm';
import { useSCORMContentLoader } from '@/hooks/useSCORMContentLoader';
import { useSCORMIframe } from '@/hooks/useSCORMIframe';
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
  const { iframeRef, handleIframeLoad, handleIframeError } = useSCORMIframe();

  if (error) {
    return <SCORMErrorDisplay error={error} onRetry={retry} />;
  }

  if (isLoading || !contentUrl) {
    return <SCORMLoadingDisplay />;
  }

  console.log('Rendering SCORM content with URL:', contentUrl);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src={contentUrl}
        className="w-full h-full border-0 rounded-b-lg"
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default SCORMContentRenderer;
