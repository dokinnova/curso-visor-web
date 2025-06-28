
export interface RewriteContext {
  getFileUrl: (path: string) => string | null;
  basePath: string;
}

function isSpecialUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/|data:|#|mailto:|tel:|blob:)/.test(url);
}

function cleanUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

export function rewriteHtmlContent(htmlContent: string, context: RewriteContext): string {
  console.log('[HTMLRewriter] Starting simplified HTML rewrite');
  
  if (!htmlContent || htmlContent.trim().length === 0) {
    console.error('[HTMLRewriter] Empty HTML content received');
    return htmlContent;
  }

  // En lugar de reescribir URLs, solo inyectar el API SCORM
  let modifiedHtml = htmlContent;
  
  // Inyectar SCORM API en el head
  const scormApiScript = `
    <script>
      // SCORM 1.2 API Mock
      window.API = {
        LMSInitialize: function(param) {
          console.log('SCORM: LMSInitialize called with', param);
          return 'true';
        },
        LMSFinish: function(param) {
          console.log('SCORM: LMSFinish called with', param);
          return 'true';
        },
        LMSGetValue: function(element) {
          console.log('SCORM: LMSGetValue called with', element);
          return '';
        },
        LMSSetValue: function(element, value) {
          console.log('SCORM: LMSSetValue called with', element, value);
          return 'true';
        },
        LMSCommit: function(param) {
          console.log('SCORM: LMSCommit called with', param);
          return 'true';
        },
        LMSGetLastError: function() {
          return '0';
        },
        LMSGetErrorString: function(errorCode) {
          return 'No error';
        },
        LMSGetDiagnostic: function(errorCode) {
          return 'No error';
        }
      };
      
      // También para SCORM 2004
      window.API_1484_11 = window.API;
      
      console.log('SCORM API injected successfully');
    </script>
  `;
  
  // Insertar el script antes del cierre del head o al inicio del body
  if (modifiedHtml.includes('</head>')) {
    modifiedHtml = modifiedHtml.replace('</head>', scormApiScript + '</head>');
  } else if (modifiedHtml.includes('<body>')) {
    modifiedHtml = modifiedHtml.replace('<body>', '<body>' + scormApiScript);
  } else {
    modifiedHtml = scormApiScript + modifiedHtml;
  }
  
  console.log('[HTMLRewriter] SCORM API injected successfully');
  return modifiedHtml;
}
