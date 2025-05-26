
export interface VirtualFile {
  content: Blob;
  url: string;
  mimeType: string;
}

export interface FileInfo {
  path: string;
  url: string;
  mimeType: string;
}
