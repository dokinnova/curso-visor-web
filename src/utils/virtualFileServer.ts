
interface VirtualFile {
  content: Blob;
  url: string;
  mimeType: string;
}

class VirtualFileServer {
  private files: Map<string, VirtualFile> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = '/virtual-scorm/') {
    this.baseUrl = baseUrl;
  }

  addFile(path: string, file: File): string {
    const normalizedPath = this.normalizePath(path);
    const url = URL.createObjectURL(file);
    const mimeType = file.type || this.getMimeTypeFromPath(path);
    
    this.files.set(normalizedPath, {
      content: file,
      url,
      mimeType
    });

    console.log(`Virtual file server: Added file ${normalizedPath} -> ${url}`);
    return url;
  }

  getFile(path: string): VirtualFile | null {
    const normalizedPath = this.normalizePath(path);
    return this.files.get(normalizedPath) || null;
  }

  resolveUrl(href: string): string | null {
    // Remover query parameters para buscar el archivo base
    const [basePath] = href.split('?');
    const normalizedPath = this.normalizePath(basePath);
    
    console.log(`Virtual file server: Resolving ${href} -> ${normalizedPath}`);
    
    // Buscar coincidencia exacta
    let file = this.files.get(normalizedPath);
    
    if (!file) {
      // Buscar coincidencias parciales
      for (const [filePath, fileData] of this.files) {
        if (filePath.endsWith(normalizedPath) || normalizedPath.endsWith(filePath)) {
          console.log(`Virtual file server: Found partial match ${filePath} for ${normalizedPath}`);
          file = fileData;
          break;
        }
      }
    }
    
    if (!file) {
      // Buscar por nombre de archivo
      const fileName = normalizedPath.split('/').pop() || '';
      for (const [filePath, fileData] of this.files) {
        if (filePath.split('/').pop() === fileName) {
          console.log(`Virtual file server: Found filename match ${filePath} for ${fileName}`);
          file = fileData;
          break;
        }
      }
    }

    return file ? file.url : null;
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  private getMimeTypeFromPath(path: string): string {
    const extension = path.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'pdf': 'application/pdf'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  getAllFiles(): Array<{ path: string; url: string }> {
    return Array.from(this.files.entries()).map(([path, file]) => ({
      path,
      url: file.url
    }));
  }

  clear(): void {
    // Revocar todas las URLs de objetos para liberar memoria
    this.files.forEach(file => {
      URL.revokeObjectURL(file.url);
    });
    this.files.clear();
  }
}

export default VirtualFileServer;
