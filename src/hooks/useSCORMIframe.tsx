
import { useRef } from 'react';

export const useSCORMIframe = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    console.log('SCORM iframe loaded successfully');
    
    if (iframeRef.current) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          // Wait a bit for the content to fully load
          setTimeout(() => {
            try {
              // Check for SCORM 1.2 API
              if ((iframeWindow as any).API) {
                console.log('SCORM 1.2 API detected in iframe');
                const initResult = (iframeWindow as any).API.LMSInitialize('');
                console.log('SCORM 1.2 auto-initialization result:', initResult);
              } 
              // Check for SCORM 2004 API
              else if ((iframeWindow as any).API_1484_11) {
                console.log('SCORM 2004 API detected in iframe');
                const initResult = (iframeWindow as any).API_1484_11.Initialize('');
                console.log('SCORM 2004 auto-initialization result:', initResult);
              } 
              else {
                console.warn('No SCORM API found in iframe content');
                // Try to inject API if not found
                if (iframeWindow.document) {
                  console.log('Attempting to inject SCORM API into iframe...');
                  injectSCORMAPIIntoIframe(iframeWindow);
                }
              }
            } catch (e) {
              console.log('Cannot access iframe content due to CORS restrictions, this is normal for some SCORM packages');
            }
          }, 1500); // Increased wait time for better compatibility
        }
      } catch (e) {
        console.log('Cannot access iframe content (CORS)');
      }
    }
  };

  const injectSCORMAPIIntoIframe = (iframeWindow: Window) => {
    try {
      const script = iframeWindow.document.createElement('script');
      script.textContent = `
        console.log('Injecting SCORM API directly into iframe...');
        
        // SCORM 1.2 API
        if (!window.API) {
          window.API = {
            LMSInitialize: function(param) {
              console.log('SCORM 1.2 API: LMSInitialize called');
              return 'true';
            },
            LMSFinish: function(param) {
              console.log('SCORM 1.2 API: LMSFinish called');
              return 'true';
            },
            LMSGetValue: function(element) {
              console.log('SCORM 1.2 API: LMSGetValue called for:', element);
              return '';
            },
            LMSSetValue: function(element, value) {
              console.log('SCORM 1.2 API: LMSSetValue called for:', element, 'with value:', value);
              return 'true';
            },
            LMSCommit: function(param) {
              console.log('SCORM 1.2 API: LMSCommit called');
              return 'true';
            },
            LMSGetLastError: function() { return '0'; },
            LMSGetErrorString: function(code) { return 'No error'; },
            LMSGetDiagnostic: function(code) { return 'No diagnostic'; }
          };
          console.log('SCORM 1.2 API injected successfully');
        }
        
        // SCORM 2004 API
        if (!window.API_1484_11) {
          window.API_1484_11 = {
            Initialize: function(param) {
              console.log('SCORM 2004 API: Initialize called');
              return 'true';
            },
            Terminate: function(param) {
              console.log('SCORM 2004 API: Terminate called');
              return 'true';
            },
            GetValue: function(element) {
              console.log('SCORM 2004 API: GetValue called for:', element);
              return '';
            },
            SetValue: function(element, value) {
              console.log('SCORM 2004 API: SetValue called for:', element, 'with value:', value);
              return 'true';
            },
            Commit: function(param) {
              console.log('SCORM 2004 API: Commit called');
              return 'true';
            },
            GetLastError: function() { return '0'; },
            GetErrorString: function(code) { return 'No error'; },
            GetDiagnostic: function(code) { return 'No diagnostic'; }
          };
          console.log('SCORM 2004 API injected successfully');
        }
      `;
      iframeWindow.document.head.appendChild(script);
    } catch (e) {
      console.warn('Failed to inject SCORM API into iframe:', e);
    }
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load SCORM content');
  };

  return {
    iframeRef,
    handleIframeLoad,
    handleIframeError
  };
};
