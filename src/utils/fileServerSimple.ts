interface ServedFile {
  blob: Blob;
  url: string;
  path: string;
}

export class SimpleFileServer {
  private files: Map<string, ServedFile> = new Map();
  private urlToPath: Map<string, string> = new Map();

  addFile(path: string, file: File): string {
    // Normalizar la ruta
    const normalizedPath = this.normalizePath(path);
    
    // Crear URL del blob
    const url = URL.createObjectURL(file);
    
    const servedFile: ServedFile = {
      blob: file,
      url,
      path: normalizedPath
    };

    this.files.set(normalizedPath, servedFile);
    this.urlToPath.set(url, normalizedPath);

    console.log(`SimpleFileServer: Added ${normalizedPath} -> ${url}`);
    return url;
  }

  getFileUrl(path: string): string | null {
    const normalizedPath = this.normalizePath(path);
    
    console.log(`SimpleFileServer: Looking for "${normalizedPath}"`);
    
    // Buscar archivo exacto
    const file = this.files.get(normalizedPath);
    if (file) {
      console.log(`SimpleFileServer: Found exact match for "${normalizedPath}"`);
      return file.url;
    }

    // Buscar por nombre de archivo
    const fileName = normalizedPath.split('/').pop()?.toLowerCase();
    if (fileName) {
      for (const [filePath, file] of this.files) {
        const currentFileName = filePath.split('/').pop()?.toLowerCase();
        if (currentFileName === fileName) {
          console.log(`SimpleFileServer: Found ${fileName} at ${filePath}`);
          return file.url;
        }
      }
    }

    // Buscar variaciones comunes
    const variations = this.generatePathVariations(normalizedPath);
    for (const variation of variations) {
      const file = this.files.get(variation);
      if (file) {
        console.log(`SimpleFileServer: Found variation "${variation}" for "${normalizedPath}"`);
        return file.url;
      }
    }

    console.warn(`SimpleFileServer: Could not find "${normalizedPath}"`);
    return null;
  }

  findMainFile(): string | null {
    // Lista de archivos de entrada comunes en orden de prioridad
    const entryFiles = [
      'index.html',
      'index.htm',
      'main.html',
      'main.htm',
      'start.html',
      'start.htm',
      'launch.html',
      'launch.htm',
      'default.html',
      'default.htm'
    ];

    // Buscar archivos de entrada comunes
    for (const entryFile of entryFiles) {
      const url = this.getFileUrl(entryFile);
      if (url) {
        console.log(`SimpleFileServer: Found entry file ${entryFile}`);
        return url;
      }
    }

    // Si no encuentra ninguno, buscar cualquier archivo HTML
    for (const [path, file] of this.files) {
      if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
        console.log(`SimpleFileServer: Using HTML file ${path}`);
        return file.url;
      }
    }

    return null;
  }

  private generatePathVariations(path: string): string[] {
    const variations: string[] = [];
    
    // Variación con "./" al inicio
    if (!path.startsWith('./')) {
      variations.push('./' + path);
    }
    
    // Variación sin "./"
    if (path.startsWith('./')) {
      variations.push(path.substring(2));
    }
    
    // Variaciones con extensiones
    if (!path.toLowerCase().endsWith('.html') && !path.toLowerCase().endsWith('.htm')) {
      variations.push(path + '.html');
      variations.push(path + '.htm');
    }
    
    return variations;
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
  }

  clear(): void {
    for (const file of this.files.values()) {
      URL.revokeObjectURL(file.url);
    }
    this.files.clear();
    this.urlToPath.clear();
  }

  getAllFiles(): Array<{ path: string; url: string }> {
    return Array.from(this.files.entries()).map(([path, file]) => ({
      path,
      url: file.url
    }));
  }
}
