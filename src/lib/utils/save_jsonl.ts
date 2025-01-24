import fs from 'fs/promises';
import path from 'path';
import { domainMap } from './maps';
import { Media, Product } from '../../types';

export async function initializeJsonlFile(tienda: string): Promise<string> {
  const filePrefix = domainMap[tienda.toUpperCase()] || 'default';
  const fileName = `${filePrefix}.jsonl`;
  const filePath = path.join(process.cwd(), fileName);

  try {
    // Create or truncate the file
    await fs.writeFile(filePath, '', { flag: 'w' }); // 'w' ensures truncation
    console.log(`JSONL file initialized: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error(`Failed to initialize JSONL file: ${error.message}`);
    throw error;
  }
}


export async function saveProductAndMediaAsJsonl(
  shopifyProduct: Product,
  media: Media[],
  tienda: string,
  filePath?: string
): Promise<void> {
  // Determine file name
  const filePrefix = domainMap[tienda.toUpperCase()] || 'default';
  const fileName = `${filePrefix}.jsonl`;
  const jsonlPath = filePath || path.join(process.cwd(), fileName);

  // Build payload with "product" and "media" if media is not empty
  const payload: Record<string, unknown> = {
    product: shopifyProduct,
  };

  if (media && media.length > 0) {
    payload.media = media;
  }

  // Append to JSONL file
  const jsonlString = JSON.stringify(payload) + '\n';

  try {
    await fs.writeFile(jsonlPath, jsonlString, { flag: 'a' });
    console.log(`Product saved to ${jsonlPath}${media.length > 0 ? ' (with media)' : ''}`);
  } catch (error: any) {
    console.error(`Failed to save Product + Media to JSONL: ${error.message}`);
    throw error;
  }
}

export async function cleanJsonlFile(tienda: string): Promise<void> {
    // Get the file name prefix from domainMap
    const filePrefix = domainMap[tienda.toUpperCase()] || 'default';
  
    // Construct the full file name with .jsonl extension
    const fileName = `${filePrefix}.jsonl`;
  
    // Construct the full path to the file within the backend directory
    const filePath = path.join(process.cwd(), fileName);
  
    try {
      // Check if the file exists
      await fs.access(filePath);
      
      // Truncate the file to clear its contents
      await fs.writeFile(filePath, '');
      console.log(`File ${fileName} has been cleaned.`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`File ${fileName} does not exist, no action taken.`);
      } else {
        console.error(`Failed to clean the file: ${error.message}`);
        throw error;
      }
    }
  }