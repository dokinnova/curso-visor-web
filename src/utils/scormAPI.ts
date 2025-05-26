
import { SCORMData } from '@/types/scorm';

let scormData: Partial<SCORMData> = {
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

export function setupSCORMAPI() {
  // Crear la API SCORM en el objeto window
  (window as any).API = {
    LMSInitialize: function(parameter: string): string {
      console.log('SCORM API: LMSInitialize called with:', parameter);
      return 'true';
    },

    LMSFinish: function(parameter: string): string {
      console.log('SCORM API: LMSFinish called with:', parameter);
      return 'true';
    },

    LMSGetValue: function(element: string): string {
      console.log('SCORM API: LMSGetValue called for:', element);
      const value = scormData[element as keyof SCORMData] || '';
      console.log('SCORM API: Returning value:', value);
      return value;
    },

    LMSSetValue: function(element: string, value: string): string {
      console.log('SCORM API: LMSSetValue called for:', element, 'with value:', value);
      (scormData as any)[element] = value;
      
      // Validaciones específicas
      if (element === 'cmi.core.lesson_status') {
        const validStatuses = ['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'];
        if (!validStatuses.includes(value)) {
          console.warn('SCORM API: Invalid lesson status:', value);
          return 'false';
        }
      }
      
      return 'true';
    },

    LMSCommit: function(parameter: string): string {
      console.log('SCORM API: LMSCommit called with:', parameter);
      console.log('SCORM API: Current data:', scormData);
      return 'true';
    },

    LMSGetLastError: function(): string {
      return '0';
    },

    LMSGetErrorString: function(errorCode: string): string {
      const errorStrings: { [key: string]: string } = {
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

    LMSGetDiagnostic: function(errorCode: string): string {
      return 'Diagnostic information for error ' + errorCode;
    }
  };

  // También crear versión SCORM 2004
  (window as any).API_1484_11 = {
    Initialize: function(parameter: string): string {
      console.log('SCORM 2004 API: Initialize called with:', parameter);
      return 'true';
    },

    Terminate: function(parameter: string): string {
      console.log('SCORM 2004 API: Terminate called with:', parameter);
      return 'true';
    },

    GetValue: function(element: string): string {
      console.log('SCORM 2004 API: GetValue called for:', element);
      // Mapear elementos SCORM 2004 a SCORM 1.2
      const scorm2004Map: { [key: string]: string } = {
        'cmi.completion_status': 'cmi.core.lesson_status',
        'cmi.learner_id': 'cmi.core.student_id',
        'cmi.learner_name': 'cmi.core.student_name',
        'cmi.location': 'cmi.core.lesson_location',
        'cmi.score.raw': 'cmi.core.score.raw',
        'cmi.score.min': 'cmi.core.score.min',
        'cmi.score.max': 'cmi.core.score.max'
      };
      
      const mappedElement = scorm2004Map[element] || element;
      const value = scormData[mappedElement as keyof SCORMData] || '';
      console.log('SCORM 2004 API: Returning value:', value);
      return value;
    },

    SetValue: function(element: string, value: string): string {
      console.log('SCORM 2004 API: SetValue called for:', element, 'with value:', value);
      // Mapear elementos SCORM 2004 a SCORM 1.2
      const scorm2004Map: { [key: string]: string } = {
        'cmi.completion_status': 'cmi.core.lesson_status',
        'cmi.learner_id': 'cmi.core.student_id',
        'cmi.learner_name': 'cmi.core.student_name',
        'cmi.location': 'cmi.core.lesson_location',
        'cmi.score.raw': 'cmi.core.score.raw',
        'cmi.score.min': 'cmi.core.score.min',
        'cmi.score.max': 'cmi.core.score.max'
      };
      
      const mappedElement = scorm2004Map[element] || element;
      (scormData as any)[mappedElement] = value;
      return 'true';
    },

    Commit: function(parameter: string): string {
      console.log('SCORM 2004 API: Commit called with:', parameter);
      return 'true';
    },

    GetLastError: function(): string {
      return '0';
    },

    GetErrorString: function(errorCode: string): string {
      return 'No error';
    },

    GetDiagnostic: function(errorCode: string): string {
      return 'No diagnostic available';
    }
  };

  console.log('SCORM APIs initialized successfully');
}

export function getSCORMData(): Partial<SCORMData> {
  return { ...scormData };
}

export function resetSCORMData(): void {
  scormData = {
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
}
