
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
    console.log(`Virtual file server: Resolving ${href}`);
    
    // Si la URL contiene parámetros, intentar cargar el archivo base
    const [basePath] = href.split('?');
    const normalizedPath = this.normalizePath(basePath);
    
    // Buscar coincidencia exacta primero
    let file = this.files.get(normalizedPath);
    
    if (file) {
      console.log(`Virtual file server: Found exact match for ${normalizedPath}`);
      return file.url;
    }
    
    // Si el archivo principal no se encuentra, buscar archivos HTML principales
    const htmlCandidates = [
      'index.html',
      'main.html',
      'start.html',
      'launch.html',
      normalizedPath
    ];
    
    for (const candidate of htmlCandidates) {
      file = this.files.get(candidate);
      if (file) {
        console.log(`Virtual file server: Found HTML candidate ${candidate}`);
        return file.url;
      }
    }
    
    // Buscar coincidencias parciales por nombre de archivo
    const fileName = normalizedPath.split('/').pop() || '';
    if (fileName) {
      for (const [filePath, fileData] of this.files) {
        if (filePath.split('/').pop() === fileName) {
          console.log(`Virtual file server: Found filename match ${filePath} for ${fileName}`);
          return fileData.url;
        }
      }
    }
    
    // Buscar cualquier archivo HTML si no encontramos el principal
    for (const [filePath, fileData] of this.files) {
      if (filePath.toLowerCase().endsWith('.html') || filePath.toLowerCase().endsWith('.htm')) {
        console.log(`Virtual file server: Using HTML fallback ${filePath}`);
        return fileData.url;
      }
    }

    console.warn(`Virtual file server: Could not resolve ${href}`);
    return null;
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
    this.files.forEach(file => {
      URL.revokeObjectURL(file.url);
    });
    this.files.clear();
  }
}

export default VirtualFileServer;
