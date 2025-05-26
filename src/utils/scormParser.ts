
import JSZip from 'jszip';
import { SCORMPackage } from '@/types/scorm';
import { parseManifest } from './manifestParser';
import { getMimeType } from './xmlUtils';

export async function parseSCORMPackage(file: File): Promise<SCORMPackage> {
  console.log('=== STARTING SCORM PARSING ===');
  console.log('File received:', file.name, 'Size:', file.size);

  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  
  console.log('=== ZIP CONTENTS ===');
  zipContent.forEach((relativePath, zipEntry) => {
    console.log(`File in ZIP: ${relativePath} (${zipEntry.dir ? 'directory' : 'file'})`);
  });

  // Look for manifest
  const manifestFile = zipContent.file('imsmanifest.xml');
  if (!manifestFile) {
    console.error('imsmanifest.xml not found');
    throw new Error('No se encontró el archivo imsmanifest.xml. Asegúrate de que es un paquete SCORM válido.');
  }

  console.log('=== READING MANIFEST ===');
  const manifestXml = await manifestFile.async('text');
  console.log('COMPLETE manifest XML content:');
  console.log(manifestXml);

  const manifest = parseManifest(manifestXml);
  console.log('=== COMPLETE PARSED MANIFEST ===');
  console.log('Parsed manifest:', JSON.stringify(manifest, null, 2));

  // Extract all files
  const files = new Map<string, File>();
  const filePromises: Promise<void>[] = [];

  zipContent.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      filePromises.push(
        zipEntry.async('blob').then(blob => {
          const file = new File([blob], relativePath, { type: getMimeType(relativePath) });
          files.set(relativePath, file);
          console.log(`File extracted: ${relativePath} (${file.size} bytes)`);
        })
      );
    }
  });

  await Promise.all(filePromises);
  console.log(`=== EXTRACTION COMPLETE: ${files.size} files ===`);

  return {
    manifest,
    files,
    baseUrl: URL.createObjectURL(file)
  };
}
