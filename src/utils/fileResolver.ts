
import { VirtualFile } from './fileTypes';
import { generatePathVariations, normalizePath } from './pathUtils';

export class FileResolver {
  private files: Map<string, VirtualFile>;
  private urlMap: Map<string, string>;

  constructor(files: Map<string, VirtualFile>, urlMap: Map<string, string>) {
    this.files = files;
    this.urlMap = urlMap;
  }

  findFileByPath(path: string): VirtualFile | null {
    const normalizedPath = normalizePath(path);
    
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

  findFileByName(fileName: string): VirtualFile | null {
    for (const [filePath, fileData] of this.files) {
      const currentFileName = filePath.split('/').pop();
      if (currentFileName && currentFileName.toLowerCase() === fileName.toLowerCase()) {
        return fileData;
      }
    }
    return null;
  }

  findFirstHtmlFile(): VirtualFile | null {
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
    const variations = generatePathVariations(cleanPath);
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
}
