
export {};

declare global {
  interface Window {
    API?: {
      LMSInitialize: (parameter: string) => string;
      LMSFinish: (parameter: string) => string;
      LMSGetValue: (element: string) => string;
      LMSSetValue: (element: string, value: string) => string;
      LMSCommit: (parameter: string) => string;
      LMSGetLastError: () => string;
      LMSGetErrorString: (errorCode: string) => string;
      LMSGetDiagnostic: (errorCode: string) => string;
    };
    API_1484_11?: {
      Initialize: (parameter: string) => string;
      Terminate: (parameter: string) => string;
      GetValue: (element: string) => string;
      SetValue: (element: string, value: string) => string;
      Commit: (parameter: string) => string;
      GetLastError: () => string;
      GetErrorString: (errorCode: string) => string;
      GetDiagnostic: (errorCode: string) => string;
    };
  }
}
