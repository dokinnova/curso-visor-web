
export function createSCORMAPI() {
  const scormData: { [key: string]: string } = {
    'cmi.core.lesson_status': 'not attempted',
    'cmi.core.student_id': 'student_001',
    'cmi.core.student_name': 'Estudiante Demo',
    'cmi.core.score.raw': '0',
    'cmi.core.score.min': '0',
    'cmi.core.score.max': '100',
    'cmi.core.total_time': '00:00:00',
    'cmi.core.lesson_location': '',
    'cmi.core.exit': '',
    'cmi.core.entry': 'ab-initio',
    'cmi.suspend_data': ''
  };

  return {
    LMSInitialize: function(parameter: string): string {
      console.log('SCORM API (Injected): LMSInitialize called with:', parameter);
      return 'true';
    },

    LMSFinish: function(parameter: string): string {
      console.log('SCORM API (Injected): LMSFinish called with:', parameter);
      return 'true';
    },

    LMSGetValue: function(element: string): string {
      console.log('SCORM API (Injected): LMSGetValue called for:', element);
      const value = scormData[element] || '';
      console.log('SCORM API (Injected): Returning value:', value);
      return value;
    },

    LMSSetValue: function(element: string, value: string): string {
      console.log('SCORM API (Injected): LMSSetValue called for:', element, 'with value:', value);
      scormData[element] = value;
      
      if (element === 'cmi.core.lesson_status') {
        const validStatuses = ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'];
        if (!validStatuses.includes(value)) {
          console.warn('SCORM API (Injected): Invalid lesson status:', value);
          return 'false';
        }
      }
      
      return 'true';
    },

    LMSCommit: function(parameter: string): string {
      console.log('SCORM API (Injected): LMSCommit called with:', parameter);
      console.log('SCORM API (Injected): Current data:', scormData);
      return 'true';
    },

    LMSGetLastError: function(): string {
      return '0';
    },

    LMSGetErrorString: function(errorCode: string): string {
      const errorStrings: { [key: string]: string } = {
        '0': 'No error',
        '101': 'General exception',
        '201': 'Invalid argument error'
      };
      return errorStrings[errorCode] || 'Unknown error';
    },

    LMSGetDiagnostic: function(errorCode: string): string {
      return 'Diagnostic information for error ' + errorCode;
    }
  };
}

export function injectSCORMIntoHTML(htmlContent: string): string {
  const scormScript = `<script>
// Datos SCORM iniciales
var scormData = {
  'cmi.core.lesson_status': 'not attempted',
  'cmi.core.student_id': 'student_001',
  'cmi.core.student_name': 'Estudiante Demo',
  'cmi.core.score.raw': '0',
  'cmi.core.score.min': '0',
  'cmi.core.score.max': '100',
  'cmi.core.total_time': '00:00:00',
  'cmi.core.lesson_location': '',
  'cmi.core.exit': '',
  'cmi.core.entry': 'ab-initio',
  'cmi.suspend_data': ''
};

// API SCORM 1.2
window.API = {
  LMSInitialize: function(parameter) {
    console.log('SCORM API (Injected): LMSInitialize called with:', parameter);
    return 'true';
  },
  LMSFinish: function(parameter) {
    console.log('SCORM API (Injected): LMSFinish called with:', parameter);
    return 'true';
  },
  LMSGetValue: function(element) {
    console.log('SCORM API (Injected): LMSGetValue called for:', element);
    var value = scormData[element] || '';
    console.log('SCORM API (Injected): Returning value:', value);
    return value;
  },
  LMSSetValue: function(element, value) {
    console.log('SCORM API (Injected): LMSSetValue called for:', element, 'with value:', value);
    scormData[element] = value;
    
    if (element === 'cmi.core.lesson_status') {
      var validStatuses = ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'];
      if (validStatuses.indexOf(value) === -1) {
        console.warn('SCORM API (Injected): Invalid lesson status:', value);
        return 'false';
      }
    }
    
    return 'true';
  },
  LMSCommit: function(parameter) {
    console.log('SCORM API (Injected): LMSCommit called with:', parameter);
    console.log('SCORM API (Injected): Current data:', scormData);
    return 'true';
  },
  LMSGetLastError: function() {
    return '0';
  },
  LMSGetErrorString: function(errorCode) {
    var errorStrings = {
      '0': 'No error',
      '101': 'General exception',
      '201': 'Invalid argument error'
    };
    return errorStrings[errorCode] || 'Unknown error';
  },
  LMSGetDiagnostic: function(errorCode) {
    return 'Diagnostic information for error ' + errorCode;
  }
};

// API SCORM 2004
window.API_1484_11 = {
  Initialize: window.API.LMSInitialize,
  Terminate: window.API.LMSFinish,
  GetValue: window.API.LMSGetValue,
  SetValue: window.API.LMSSetValue,
  Commit: window.API.LMSCommit,
  GetLastError: window.API.LMSGetLastError,
  GetErrorString: window.API.LMSGetErrorString,
  GetDiagnostic: window.API.LMSGetDiagnostic
};

console.log('SCORM API inyectada correctamente en el iframe');
</script>`;

  // Insertar el script justo después del tag <head> o antes del primer <script>
  if (htmlContent.includes('<head>')) {
    return htmlContent.replace('<head>', '<head>' + scormScript);
  } else if (htmlContent.includes('<script>')) {
    return htmlContent.replace('<script>', scormScript + '<script>');
  } else {
    // Si no hay head ni script, insertar al principio del body o del documento
    if (htmlContent.includes('<body>')) {
      return htmlContent.replace('<body>', '<body>' + scormScript);
    } else {
      return scormScript + htmlContent;
    }
  }
}

export function createModifiedBlob(originalFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const htmlContent = event.target?.result as string;
        const modifiedContent = injectSCORMIntoHTML(htmlContent);
        
        const modifiedBlob = new Blob([modifiedContent], { type: 'text/html' });
        const modifiedFile = new File([modifiedBlob], originalFile.name, { 
          type: 'text/html',
          lastModified: originalFile.lastModified 
        });
        
        resolve(modifiedFile);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(originalFile);
  });
}
