
import { Organization, Item } from '@/types/scorm';

export function parseOrganizations(doc: Document): Organization[] {
  console.log('=== PARSING SCORM 1.2 ORGANIZATIONS ===');
  
  const organizations: Organization[] = [];
  
  // Find organizations container
  const organizationsContainer = doc.querySelector('organizations');
  if (!organizationsContainer) {
    console.error('No organizations container found');
    return [];
  }

  console.log('Organizations container found');
  
  // Find all organization elements
  const orgElements = organizationsContainer.querySelectorAll('organization');
  console.log(`Found ${orgElements.length} organization elements`);

  if (orgElements.length === 0) {
    console.warn('No organization elements found, creating default organization...');
    return createDefaultOrganization(organizationsContainer);
  }

  orgElements.forEach((orgElement, index) => {
    console.log(`=== PROCESSING ORGANIZATION ${index + 1} ===`);
    
    const identifier = orgElement.getAttribute('identifier') || `org-${index}`;
    
    // Find title with multiple strategies
    let title = 'Organización sin título';
    const titleElement = orgElement.querySelector(':scope > title');
    if (titleElement?.textContent?.trim()) {
      title = titleElement.textContent.trim();
    } else {
      // Try attribute
      title = orgElement.getAttribute('title') || `Organización ${index + 1}`;
    }
    
    console.log(`Organization: ${identifier} - ${title}`);

    // Parse items for this organization
    const items = parseItems(orgElement);
    console.log(`Items parsed: ${items.length}`);

    if (items.length > 0) {
      organizations.push({
        identifier,
        title,
        items
      });
    }
  });

  console.log('=== ORGANIZATIONS PARSING COMPLETE ===');
  return organizations;
}

function createDefaultOrganization(organizationsContainer: Element): Organization[] {
  console.log('Creating default organization...');
  
  // Look for items directly in the container
  const directItems = organizationsContainer.querySelectorAll('item');
  if (directItems.length === 0) {
    console.warn('No items found in organizations');
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
  console.log('=== PARSING SCORM 1.2 ITEMS ===');
  
  const items: Item[] = [];
  
  // Look for direct items first
  let itemElements = parent.querySelectorAll(':scope > item');
  
  // If no direct items, look for all items
  if (itemElements.length === 0) {
    itemElements = parent.querySelectorAll('item');
  }

  console.log(`Found ${itemElements.length} items to process`);

  itemElements.forEach((itemElement, index) => {
    const item = parseItemElement(itemElement, index);
    if (item) {
      items.push(item);
    }
  });

  return items;
}

export function parseItemElement(itemElement: Element, index: number): Item | null {
  console.log(`--- Processing item ${index + 1} ---`);
  
  const identifier = itemElement.getAttribute('identifier') || `item-${index}`;
  const identifierref = itemElement.getAttribute('identifierref') || undefined;
  const isVisible = itemElement.getAttribute('isvisible') !== 'false';
  
  // Only process visible items
  if (!isVisible) {
    console.log(`Item ${identifier} is not visible, skipping`);
    return null;
  }
  
  console.log('Item identifier:', identifier);
  console.log('Item identifierref:', identifierref);
  
  // Find title with multiple strategies for SCORM 1.2
  let title = '';
  
  // Strategy 1: direct title element
  const titleElement = itemElement.querySelector(':scope > title');
  if (titleElement?.textContent?.trim()) {
    title = titleElement.textContent.trim();
  }
  
  // Strategy 2: title attribute
  if (!title) {
    title = itemElement.getAttribute('title') || '';
  }
  
  // Strategy 3: use identifier as fallback
  if (!title) {
    title = identifier;
  }
  
  console.log('Item title:', title);

  // Determine if it's a content item or just navigation
  const hasContent = !!identifierref;
  console.log('Item has content:', hasContent);

  // Find child items recursively
  const childItems = itemElement.querySelectorAll(':scope > item');
  const children: Item[] = [];
  
  childItems.forEach((childElement, childIndex) => {
    const childItem = parseItemElement(childElement, childIndex);
    if (childItem) {
      children.push(childItem);
    }
  });

  if (children.length > 0) {
    console.log(`Item has ${children.length} sub-items`);
  }

  const item: Item = {
    identifier,
    title,
    identifierref,
    children: children.length > 0 ? children : undefined
  };

  console.log('Item processed:', item);
  return item;
}
