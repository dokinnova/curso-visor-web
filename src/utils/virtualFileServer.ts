
interface VirtualFile {
  content: Blob;
  url: string;
  mimeType: string;
}

class VirtualFileServer {
  private files: Map<string, VirtualFile> = new Map();
  private baseUrl: string;
  private urlMap: Map<string, string> = new Map(); // Para mapear rutas a URLs

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

    // También mapear el path original sin normalizar
    this.urlMap.set(path, url);
    this.urlMap.set(normalizedPath, url);

    console.log(`Virtual file server: Added file ${normalizedPath} -> ${url}`);
    return url;
  }

  getFile(path: string): VirtualFile | null {
    const normalizedPath = this.normalizePath(path);
    return this.files.get(normalizedPath) || null;
  }

  resolveUrl(href: string): string | null {
    console.log(`Virtual file server: Resolving "${href}"`);
    
    if (!href) {
      console.warn('Empty href provided');
      return null;
    }

    // Limpiar la URL de parámetros
    const [basePath] = href.split('?');
    const cleanPath = basePath.split('#')[0]; // También quitar fragmentos
    
    console.log(`Virtual file server: Clean path: "${cleanPath}"`);

    // Buscar coincidencia exacta primero
    let file = this.findFileByPath(cleanPath);
    if (file) {
      console.log(`Virtual file server: Found exact match for "${cleanPath}"`);
      return file.url;
    }

    // Si no encuentra el archivo exacto, buscar variaciones
    const variations = this.generatePathVariations(cleanPath);
    for (const variation of variations) {
      file = this.findFileByPath(variation);
      if (file) {
        console.log(`Virtual file server: Found variation match "${variation}" for "${cleanPath}"`);
        return file.url;
      }
    }

    // Buscar por nombre de archivo solamente
    const fileName = cleanPath.split('/').pop();
    if (fileName) {
      file = this.findFileByName(fileName);
      if (file) {
        console.log(`Virtual file server: Found by filename "${fileName}"`);
        return file.url;
      }
    }

    // Como último recurso, buscar archivos HTML
    const htmlFile = this.findFirstHtmlFile();
    if (htmlFile) {
      console.log(`Virtual file server: Using HTML fallback`);
      return htmlFile.url;
    }

    console.warn(`Virtual file server: Could not resolve "${href}"`);
    return null;
  }

  private findFileByPath(path: string): VirtualFile | null {
    const normalizedPath = this.normalizePath(path);
    
    // Buscar en el mapa de archivos
    const file = this.files.get(normalizedPath);
    if (file) return file;

    // Buscar en el mapa de URLs
    const url = this.urlMap.get(path) || this.urlMap.get(normalizedPath);
    if (url) {
      // Encontrar el archivo que corresponde a esta URL
      for (const [filePath, fileData] of this.files) {
        if (fileData.url === url) {
          return fileData;
        }
      }
    }

    return null;
  }

  private findFileByName(fileName: string): VirtualFile | null {
    for (const [filePath, fileData] of this.files) {
      const currentFileName = filePath.split('/').pop();
      if (currentFileName && currentFileName.toLowerCase() === fileName.toLowerCase()) {
        return fileData;
      }
    }
    return null;
  }

  private findFirstHtmlFile(): VirtualFile | null {
    // Priorizar archivos HTML comunes
    const htmlPriority = ['index.html', 'main.html', 'start.html', 'launch.html', 'default.html'];
    
    for (const htmlFile of htmlPriority) {
      const file = this.findFileByName(htmlFile);
      if (file) return file;
    }

    // Si no encuentra ninguno de los prioritarios, buscar cualquier HTML
    for (const [filePath, fileData] of this.files) {
      if (filePath.toLowerCase().endsWith('.html') || filePath.toLowerCase().endsWith('.htm')) {
        return fileData;
      }
    }

    return null;
  }

  private generatePathVariations(path: string): string[] {
    const variations: string[] = [];
    const normalizedPath = this.normalizePath(path);
    
    // Agregar variaciones comunes
    variations.push(normalizedPath);
    variations.push(path); // Path original
    
    // Si no termina en .html, intentar agregarlo
    if (!normalizedPath.toLowerCase().endsWith('.html') && !normalizedPath.toLowerCase().endsWith('.htm')) {
      variations.push(normalizedPath + '.html');
      variations.push(normalizedPath + '.htm');
    }

    // Si empieza con ./, quitarlo
    if (normalizedPath.startsWith('./')) {
      variations.push(normalizedPath.substring(2));
    }

    // Si no empieza con ./, agregarlo
    if (!normalizedPath.startsWith('./')) {
      variations.push('./' + normalizedPath);
    }

    // Quitar directorios padre (../)
    const withoutParentDirs = normalizedPath.replace(/\.\.\//g, '');
    if (withoutParentDirs !== normalizedPath) {
      variations.push(withoutParentDirs);
    }

    return [...new Set(variations)]; // Eliminar duplicados
  }

  private normalizePath(path: string): string {
    // Normalizar separadores de directorio
    let normalized = path.replace(/\\/g, '/');
    
    // Quitar barras iniciales
    normalized = normalized.replace(/^\/+/, '');
    
    // Resolver referencias padre (..)
    const parts = normalized.split('/');
    const resolved: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.' && part !== '') {
        resolved.push(part);
      }
    }
    
    return resolved.join('/');
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
      'pdf': 'application/pdf',
      'swf': 'application/x-shockwave-flash'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  getAllFiles(): Array<{ path: string; url: string; mimeType: string }> {
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
