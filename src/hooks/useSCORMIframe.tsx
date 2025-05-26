
import { useRef } from 'react';

export const useSCORMIframe = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    console.log('=== IFRAME LOADED ===');
    
    if (iframeRef.current) {
      console.log('Iframe src:', iframeRef.current.src);
      
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          // Wait for content to fully load
          setTimeout(() => {
            try {
              console.log('Checking for SCORM API in iframe...');
              
              // Check for SCORM 1.2 API
              if ((iframeWindow as any).API) {
                console.log('SCORM 1.2 API detected in iframe');
                const initResult = (iframeWindow as any).API.LMSInitialize('');
                console.log('SCORM 1.2 initialization result:', initResult);
              } 
              // Check for SCORM 2004 API
              else if ((iframeWindow as any).API_1484_11) {
                console.log('SCORM 2004 API detected in iframe');
                const initResult = (iframeWindow as any).API_1484_11.Initialize('');
                console.log('SCORM 2004 initialization result:', initResult);
              } 
              else {
                console.log('No SCORM API found, this is normal if injected in HTML');
              }
            } catch (e) {
              console.log('Cannot access iframe content due to security restrictions (this is normal)');
            }
          }, 1000);
        }
      } catch (e) {
        console.log('Cannot access iframe window (CORS/security restriction)');
      }
    }
  };

  const handleIframeError = (event: any) => {
    console.error('Iframe failed to load:', event);
    console.error('Current iframe src:', iframeRef.current?.src);
  };

  return {
    iframeRef,
    handleIframeLoad,
    handleIframeError
  };
};
