
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
// Datos SCORM 1.2 iniciales
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
  'cmi.suspend_data': '',
  'cmi.launch_data': '',
  'cmi.comments': '',
  'cmi.student_data.mastery_score': '80',
  'cmi.student_data.max_time_allowed': '',
  'cmi.student_data.time_limit_action': 'continue,no message'
};

// Función para buscar la API SCORM en la jerarquía de ventanas
function findAPI(win) {
  while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
    win = win.parent;
  }
  return win.API;
}

// Intentar encontrar API existente o crear una nueva
var scormAPI = findAPI(window) || findAPI(window.top) || null;

if (!scormAPI) {
  // API SCORM 1.2 completa
  window.API = {
    LMSInitialize: function(parameter) {
      console.log('SCORM 1.2 API: LMSInitialize called with:', parameter);
      if (parameter !== "" && parameter !== null) {
        return 'false';
      }
      return 'true';
    },
    
    LMSFinish: function(parameter) {
      console.log('SCORM 1.2 API: LMSFinish called with:', parameter);
      if (parameter !== "" && parameter !== null) {
        return 'false';
      }
      return 'true';
    },
    
    LMSGetValue: function(element) {
      console.log('SCORM 1.2 API: LMSGetValue called for:', element);
      if (!element || typeof element !== 'string') {
        console.warn('SCORM 1.2 API: Invalid element parameter');
        return '';
      }
      
      var value = scormData[element] || '';
      console.log('SCORM 1.2 API: Returning value:', value);
      return value;
    },
    
    LMSSetValue: function(element, value) {
      console.log('SCORM 1.2 API: LMSSetValue called for:', element, 'with value:', value);
      
      if (!element || typeof element !== 'string') {
        console.warn('SCORM 1.2 API: Invalid element parameter');
        return 'false';
      }
      
      if (value === null || value === undefined) {
        console.warn('SCORM 1.2 API: Invalid value parameter');
        return 'false';
      }
      
      // Validaciones específicas para SCORM 1.2
      if (element === 'cmi.core.lesson_status') {
        var validStatuses = ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'];
        if (validStatuses.indexOf(value) === -1) {
          console.warn('SCORM 1.2 API: Invalid lesson status:', value);
          return 'false';
        }
      }
      
      if (element === 'cmi.core.exit') {
        var validExits = ['time-out', 'suspend', 'logout', ''];
        if (validExits.indexOf(value) === -1) {
          console.warn('SCORM 1.2 API: Invalid exit value:', value);
          return 'false';
        }
      }
      
      scormData[element] = value;
      return 'true';
    },
    
    LMSCommit: function(parameter) {
      console.log('SCORM 1.2 API: LMSCommit called with:', parameter);
      console.log('SCORM 1.2 API: Current data:', scormData);
      if (parameter !== "" && parameter !== null) {
        return 'false';
      }
      return 'true';
    },
    
    LMSGetLastError: function() {
      return '0';
    },
    
    LMSGetErrorString: function(errorCode) {
      var errorStrings = {
        '0': 'No error',
        '101': 'General exception',
        '201': 'Invalid argument error',
        '202': 'Element cannot have children',
        '203': 'Element not an array - cannot have count',
        '301': 'Not initialized',
        '401': 'Not implemented error',
        '402': 'Invalid set value, element is a keyword',
        '403': 'Element is read only',
        '404': 'Element is write only',
        '405': 'Incorrect data type'
      };
      return errorStrings[errorCode] || 'Unknown error';
    },
    
    LMSGetDiagnostic: function(errorCode) {
      return 'Diagnostic information for error ' + errorCode;
    }
  };

  // También crear API SCORM 2004 para compatibilidad
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

  console.log('SCORM 1.2 API inyectada correctamente en el iframe');
} else {
  console.log('API SCORM existente encontrada, usando la existente');
}
</script>`;

  // Inyectar el script en múltiples ubicaciones para máxima compatibilidad
  if (htmlContent.includes('<head>')) {
    return htmlContent.replace('<head>', '<head>' + scormScript);
  } else if (htmlContent.includes('<html>')) {
    return htmlContent.replace('<html>', '<html>' + scormScript);
  } else if (htmlContent.includes('<body>')) {
    return htmlContent.replace('<body>', '<body>' + scormScript);
  } else {
    return scormScript + htmlContent;
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
