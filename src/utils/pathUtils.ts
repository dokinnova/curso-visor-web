
export function normalizePath(path: string): string {
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

export function generatePathVariations(path: string): string[] {
  const variations: string[] = [];
  const normalizedPath = normalizePath(path);
  
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
