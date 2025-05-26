
import { useRef } from 'react';

export const useSCORMIframe = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    console.log('SCORM 1.2 iframe loaded successfully');
    
    if (iframeRef.current) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          setTimeout(() => {
            try {
              if ((iframeWindow as any).API) {
                console.log('SCORM 1.2 API detected in iframe');
                const initResult = (iframeWindow as any).API.LMSInitialize('');
                console.log('SCORM 1.2 auto-initialization result:', initResult);
              } else {
                console.warn('SCORM 1.2 API not found in iframe');
              }
            } catch (e) {
              console.log('Cannot access iframe content due to CORS restrictions');
            }
          }, 1000);
        }
      } catch (e) {
        console.log('Cannot access iframe content (CORS)');
      }
    }
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
  };

  return {
    iframeRef,
    handleIframeLoad,
    handleIframeError
  };
};
