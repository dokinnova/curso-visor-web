
interface ServedFile {
  blob: Blob;
  url: string;
  path: string;
}

export class SimpleFileServer {
  private files: Map<string, ServedFile> = new Map();
  private urlToPath: Map<string, string> = new Map();

  addFile(path: string, file: File): string {
    console.log(`[FileServer] Adding file: "${path}"`);
    
    const normalizedPath = this.normalizePath(path);
    const url = URL.createObjectURL(file);
    
    const servedFile: ServedFile = {
      blob: file,
      url,
      path: normalizedPath
    };

    this.files.set(normalizedPath, servedFile);
    this.urlToPath.set(url, normalizedPath);

    console.log(`[FileServer] ✓ Added: ${normalizedPath} -> ${url}`);
    return url;
  }

  getFileUrl(path: string): string | null {
    console.log(`[FileServer] Getting URL for: "${path}"`);
    
    const normalizedPath = this.normalizePath(path);
    
    // Búsqueda exacta
    const exactFile = this.files.get(normalizedPath);
    if (exactFile) {
      console.log(`[FileServer] ✓ Exact match: ${normalizedPath} -> ${exactFile.url}`);
      return exactFile.url;
    }

    // Búsqueda por nombre de archivo
    const fileName = normalizedPath.split('/').pop()?.toLowerCase();
    if (fileName) {
      for (const [filePath, file] of this.files) {
        const currentFileName = filePath.split('/').pop()?.toLowerCase();
        if (currentFileName === fileName) {
          console.log(`[FileServer] ✓ Filename match: ${fileName} at ${filePath} -> ${file.url}`);
          return file.url;
        }
      }
    }

    // Búsqueda flexible
    for (const [filePath, file] of this.files) {
      if (filePath.includes(fileName || '') || filePath.endsWith(normalizedPath)) {
        console.log(`[FileServer] ✓ Flexible match: ${filePath} for ${normalizedPath} -> ${file.url}`);
        return file.url;
      }
    }

    console.log(`[FileServer] ✗ No match found for: ${normalizedPath}`);
    return null;
  }

  findMainFile(): string | null {
    console.log(`[FileServer] Finding main HTML file`);
    
    const entryFiles = ['index.html', 'index.htm', 'main.html', 'start.html'];
    
    for (const entryFile of entryFiles) {
      const url = this.getFileUrl(entryFile);
      if (url) {
        console.log(`[FileServer] ✓ Found main file: ${entryFile} -> ${url}`);
        return url;
      }
    }

    // Buscar cualquier HTML
    for (const [path, file] of this.files) {
      if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
        console.log(`[FileServer] ✓ Using HTML file: ${path} -> ${file.url}`);
        return file.url;
      }
    }

    console.log(`[FileServer] ✗ No HTML files found`);
    return null;
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/')
      .trim();
  }

  clear(): void {
    console.log(`[FileServer] Clearing ${this.files.size} files`);
    for (const file of this.files.values()) {
      try {
        URL.revokeObjectURL(file.url);
      } catch (e) {
        // Ignore errors when revoking URLs
      }
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
