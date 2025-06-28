
interface ServedFile {
  blob: Blob;
  url: string;
  path: string;
}

export class SimpleFileServer {
  private files: Map<string, ServedFile> = new Map();
  private urlToPath: Map<string, string> = new Map();

  addFile(path: string, file: File): string {
    console.log(`===== ADDING FILE TO SERVER =====`);
    console.log(`Original path: "${path}"`);
    
    // Normalizar la ruta
    const normalizedPath = this.normalizePath(path);
    console.log(`Normalized path: "${normalizedPath}"`);
    
    // Crear URL del blob
    const url = URL.createObjectURL(file);
    console.log(`Generated blob URL: "${url}"`);
    
    // Validar que la URL es válida
    try {
      new URL(url);
      console.log(`✓ Blob URL is valid`);
    } catch (e) {
      console.error(`✗ Generated invalid blob URL: ${url}`, e);
      throw new Error(`Failed to create valid blob URL for ${path}`);
    }
    
    const servedFile: ServedFile = {
      blob: file,
      url,
      path: normalizedPath
    };

    this.files.set(normalizedPath, servedFile);
    this.urlToPath.set(url, normalizedPath);

    console.log(`SimpleFileServer: Successfully added ${normalizedPath} -> ${url}`);
    return url;
  }

  getFileUrl(path: string): string | null {
    console.log(`===== GETTING FILE URL =====`);
    console.log(`Requested path: "${path}"`);
    
    const normalizedPath = this.normalizePath(path);
    console.log(`Normalized path: "${normalizedPath}"`);
    
    // Buscar archivo exacto
    const file = this.files.get(normalizedPath);
    if (file) {
      console.log(`✓ Found exact match for "${normalizedPath}" -> ${file.url}`);
      return file.url;
    }

    // Buscar por nombre de archivo
    const fileName = normalizedPath.split('/').pop()?.toLowerCase();
    console.log(`Searching by filename: "${fileName}"`);
    
    if (fileName) {
      for (const [filePath, file] of this.files) {
        const currentFileName = filePath.split('/').pop()?.toLowerCase();
        if (currentFileName === fileName) {
          console.log(`✓ Found by filename "${fileName}" at ${filePath} -> ${file.url}`);
          return file.url;
        }
      }
    }

    // Buscar variaciones comunes
    console.log(`Searching variations for: "${normalizedPath}"`);
    const variations = this.generatePathVariations(normalizedPath);
    console.log(`Generated variations:`, variations);
    
    for (const variation of variations) {
      const file = this.files.get(variation);
      if (file) {
        console.log(`✓ Found variation "${variation}" for "${normalizedPath}" -> ${file.url}`);
        return file.url;
      }
    }

    console.warn(`✗ Could not find file for path "${normalizedPath}"`);
    console.log(`Available files:`, Array.from(this.files.keys()));
    return null;
  }

  findMainFile(): string | null {
    console.log(`===== FINDING MAIN FILE =====`);
    
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
      console.log(`Checking for entry file: ${entryFile}`);
      const url = this.getFileUrl(entryFile);
      if (url) {
        console.log(`✓ Found entry file ${entryFile} -> ${url}`);
        return url;
      }
    }

    // Si no encuentra ninguno, buscar cualquier archivo HTML
    console.log(`No standard entry files found, searching for any HTML file`);
    for (const [path, file] of this.files) {
      if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
        console.log(`✓ Using HTML file ${path} -> ${file.url}`);
        return file.url;
      }
    }

    console.warn(`✗ No HTML files found`);
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
    const normalized = path
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
    
    console.log(`Normalized path "${path}" -> "${normalized}"`);
    return normalized;
  }

  clear(): void {
    console.log(`===== CLEARING FILE SERVER =====`);
    console.log(`Clearing ${this.files.size} files`);
    
    for (const file of this.files.values()) {
      URL.revokeObjectURL(file.url);
    }
    this.files.clear();
    this.urlToPath.clear();
    
    console.log(`File server cleared`);
  }

  getAllFiles(): Array<{ path: string; url: string }> {
    return Array.from(this.files.entries()).map(([path, file]) => ({
      path,
      url: file.url
    }));
  }
}
