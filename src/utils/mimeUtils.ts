
export function getMimeTypeFromPath(path: string): string {
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
