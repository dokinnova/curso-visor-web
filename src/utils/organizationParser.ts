
import { Organization, Item } from '@/types/scorm';

export function parseOrganizations(doc: Document): Organization[] {
  console.log('=== PARSEANDO ORGANIZACIONES SCORM 1.2 ===');
  
  const organizations: Organization[] = [];
  
  // Buscar el contenedor de organizaciones
  const organizationsContainer = doc.querySelector('organizations');
  if (!organizationsContainer) {
    console.error('No se encontró contenedor organizations');
    return [];
  }

  console.log('Contenedor organizations encontrado');
  
  // Buscar todos los elementos organization
  const orgElements = organizationsContainer.querySelectorAll('organization');
  console.log(`Encontrados ${orgElements.length} elementos organization`);

  if (orgElements.length === 0) {
    console.warn('No se encontraron elementos organization, creando organización por defecto...');
    return createDefaultOrganization(organizationsContainer);
  }

  orgElements.forEach((orgElement, index) => {
    console.log(`=== PROCESANDO ORGANIZACIÓN ${index + 1} ===`);
    
    const identifier = orgElement.getAttribute('identifier') || `org-${index}`;
    
    // Buscar título con múltiples estrategias
    let title = 'Organización sin título';
    const titleElement = orgElement.querySelector(':scope > title');
    if (titleElement?.textContent?.trim()) {
      title = titleElement.textContent.trim();
    } else {
      // Buscar en atributos
      title = orgElement.getAttribute('title') || `Organización ${index + 1}`;
    }
    
    console.log(`Organización: ${identifier} - ${title}`);

    // Parsear items de esta organización
    const items = parseItems(orgElement);
    console.log(`Items parseados: ${items.length}`);

    if (items.length > 0) {
      organizations.push({
        identifier,
        title,
        items
      });
    }
  });

  console.log('=== FIN PARSING ORGANIZACIONES ===');
  return organizations;
}

function createDefaultOrganization(organizationsContainer: Element): Organization[] {
  console.log('Creando organización por defecto...');
  
  // Buscar items directamente en el contenedor
  const directItems = organizationsContainer.querySelectorAll('item');
  if (directItems.length === 0) {
    console.warn('No se encontraron items en organizations');
    return [];
  }

  const defaultOrg: Organization = {
    identifier: 'default-org',
    title: 'Contenido del Curso',
    items: []
  };

  directItems.forEach((itemElement, index) => {
    const item = parseItemElement(itemElement, index);
    if (item) {
      defaultOrg.items.push(item);
    }
  });

  return defaultOrg.items.length > 0 ? [defaultOrg] : [];
}

export function parseItems(parent: Element): Item[] {
  console.log('=== PARSEANDO ITEMS SCORM 1.2 ===');
  
  const items: Item[] = [];
  
  // Buscar items directos primero
  let itemElements = parent.querySelectorAll(':scope > item');
  
  // Si no hay items directos, buscar todos los items
  if (itemElements.length === 0) {
    itemElements = parent.querySelectorAll('item');
  }

  console.log(`Encontrados ${itemElements.length} items para procesar`);

  itemElements.forEach((itemElement, index) => {
    const item = parseItemElement(itemElement, index);
    if (item) {
      items.push(item);
    }
  });

  return items;
}

export function parseItemElement(itemElement: Element, index: number): Item | null {
  console.log(`--- Procesando item ${index + 1} ---`);
  
  const identifier = itemElement.getAttribute('identifier') || `item-${index}`;
  const identifierref = itemElement.getAttribute('identifierref') || undefined;
  const isVisible = itemElement.getAttribute('isvisible') !== 'false';
  
  // Solo procesar items visibles
  if (!isVisible) {
    console.log(`Item ${identifier} no es visible, omitiendo`);
    return null;
  }
  
  console.log('Item identifier:', identifier);
  console.log('Item identifierref:', identifierref);
  
  // Buscar título con múltiples estrategias para SCORM 1.2
  let title = '';
  
  // Estrategia 1: elemento title directo
  const titleElement = itemElement.querySelector(':scope > title');
  if (titleElement?.textContent?.trim()) {
    title = titleElement.textContent.trim();
  }
  
  // Estrategia 2: atributo title
  if (!title) {
    title = itemElement.getAttribute('title') || '';
  }
  
  // Estrategia 3: usar identifier como fallback
  if (!title) {
    title = identifier;
  }
  
  console.log('Item title:', title);

  // Determinar si es un item de contenido o solo navegación
  const hasContent = !!identifierref;
  console.log('Item tiene contenido:', hasContent);

  // Buscar items hijos recursivamente
  const childItems = itemElement.querySelectorAll(':scope > item');
  const children: Item[] = [];
  
  childItems.forEach((childElement, childIndex) => {
    const childItem = parseItemElement(childElement, childIndex);
    if (childItem) {
      children.push(childItem);
    }
  });

  if (children.length > 0) {
    console.log(`Item tiene ${children.length} sub-items`);
  }

  const item: Item = {
    identifier,
    title,
    identifierref,
    children: children.length > 0 ? children : undefined
  };

  console.log('Item procesado:', item);
  return item;
}
