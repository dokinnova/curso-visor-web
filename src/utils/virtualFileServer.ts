
import { VirtualFile, FileInfo } from './fileTypes';
import { getMimeTypeFromPath } from './mimeUtils';
import { normalizePath } from './pathUtils';
import { FileResolver } from './fileResolver';

class VirtualFileServer {
  private files: Map<string, VirtualFile> = new Map();
  private baseUrl: string;
  private urlMap: Map<string, string> = new Map(); // Para mapear rutas a URLs
  private fileResolver: FileResolver;

  constructor(baseUrl: string = '/virtual-scorm/') {
    this.baseUrl = baseUrl;
    this.fileResolver = new FileResolver(this.files, this.urlMap);
  }

  addFile(path: string, file: File): string {
    const normalizedPath = normalizePath(path);
    const url = URL.createObjectURL(file);
    const mimeType = file.type || getMimeTypeFromPath(path);
    
    this.files.set(normalizedPath, {
      content: file,
      url,
      mimeType
    });

    // También mapear el path original sin normalizar
    this.urlMap.set(path, url);
    this.urlMap.set(normalizedPath, url);

    console.log(`Virtual file server: Added file ${normalizedPath} -> ${url}`);
    return url;
  }

  getFile(path: string): VirtualFile | null {
    const normalizedPath = normalizePath(path);
    return this.files.get(normalizedPath) || null;
  }

  resolveUrl(href: string): string | null {
    return this.fileResolver.resolveUrl(href);
  }

  getAllFiles(): FileInfo[] {
    return Array.from(this.files.entries()).map(([path, file]) => ({
      path,
      url: file.url,
      mimeType: file.mimeType
    }));
  }

  clear(): void {
    this.files.forEach(file => {
      URL.revokeObjectURL(file.url);
    });
    this.files.clear();
    this.urlMap.clear();
  }

  // Método para debug - listar todos los archivos disponibles
  debugListFiles(): void {
    console.log('=== DEBUG: All files in virtual server ===');
    for (const [path, file] of this.files) {
      console.log(`  "${path}" -> ${file.url} (${file.mimeType})`);
    }
    console.log('=== End debug list ===');
  }
}

export default VirtualFileServer;
