import { Hit, Product, HTML_BODY, StoreData, Media, ProductWithMedia } from "../../types";
import { get_images } from "../fn/get-images";
import { STORE_LOCATIONS } from "./maps";

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundToNearestBase(number: number, base: number): number {
  // Always round up to the next multiple of base
  return Math.ceil(number / base) * base;
}

function processPrice(basePrice: number, copUsd: number, ganancia: number): number {
  // Adjusted price with the given ganancia multiplier
  const adjustedPrice = basePrice * copUsd * (ganancia + 1);
  // Round to the nearest base (e.g., 1000)
  const nearestBase = 1000; // Change this if needed
  return roundToNearestBase(adjustedPrice, nearestBase);
}


export function process_html(attributes: string, sizeTable: Array<{ [key: string]: string }>): string {
  // Parse attributes into an unordered list
  const attributesResult = attributes
    .split(/(?:\.|\n)/) // Split by period or new line
    .map((attr) => attr.trim()) // Trim whitespace
    .filter((attr) => attr) // Remove empty entries
    .map((attr) => `<li>${attr}</li>`) // Wrap each entry in a list item
    .join('\n'); // Add line breaks for bett3er readability

  const attributesHtml = attributesResult ? `<ul>\n${attributesResult}\n</ul>` : '';

  // Process size table into a formatted HTML table
  let tableHtml = '';
  if (Array.isArray(sizeTable) && sizeTable.length > 0) {
    const columnTranslations: { [key: string]: string } = {
      Size: 'Talla',
      Waist: 'Cintura',
      Hip: 'Cadera',
      Bust: 'Busto'
    };
    
    const headers = Object.keys(sizeTable[0]); // Dynamically extract headers
    const translatedHeaders = headers.map((header) => columnTranslations[header] || header);

    const tableRows = sizeTable
      .map((size) =>
        headers
          .map((header) => `<td>${size[header] || ''}</td>`) // Generate table cells
          .join('')
      )
      .map((row) => `<tr>${row}</tr>`) // Wrap rows in <tr>
      .join('\n'); // Add line breaks for better readability

    tableHtml = `
      <style>
        table.zeetable, table.zeetable th, table.zeetable td {
          border: 1px solid black;
          border-collapse: collapse;
          font-size: 8px;
        }
        table.zeetable th, table.zeetable td {
          padding: 5px;
          text-align: left;
        }
      </style>
      <table class='zeetable'>
        <h2>Características</h2>
        <tr>${translatedHeaders.map((header) => `<th>${header}</th>`).join('')}</tr>
        ${tableRows}
      </table>`;
  }

  // Combine table and attributes HTML
  return `${tableHtml}\n<br><br>\n${attributesHtml}`;
}

export async function transformHitToProduct(
  hit: Hit,
  sizeChart: Array<Record<string, string>>,
  storeData: StoreData
): Promise<ProductWithMedia> {
  const { copUsd, ganancia, tienda, collections } = storeData;

  // Bypass products with insufficient sizes
  if (hit.all_sizes_in_stock_array.length <= 1) {
    return { product: {} as Product, media: [] }; // Return empty product and media
  }


  // Fetch images, description, and swatches dynamically using the handle
  const { images, description } = await get_images(hit.handle);

  // Process price using copUsd and ganancia
  const processedPrice = processPrice(hit.variants_min_price, copUsd, ganancia);

  // Determine locationId based on tienda
  const locationId = STORE_LOCATIONS[tienda.toUpperCase()];
  if (!locationId) {
    throw new Error(`Invalid store: ${tienda}. No location found.`);
  }

  // Create sizeTable from sizeChart
  const sizeTable = sizeChart.map((size) => ({
    ...size, // Include any additional keys if present
  }));

  // Generate HTML description
  const html = process_html(description, sizeTable);

  // Prepare the Product object
  const product: Product = {
    title: hit.title_es || hit.title, // Fallback to `title` if `title_es` is null
    productType: hit.product_type,
    published: true,
    options: ["Color", "Talla"],
    vendor: "Fashion Nova",
    handle: hit.handle,
    bodyHtml: html,
    collectionsToJoin: collections.filter((collection) => collection && collection.trim() !== ''),
    variants: [], // Initialize variants as an empty array
  };

  // Prepare the Media array
  const media: Media[] = images.map((image: any) => ({
    mediaContentType: "IMAGE",
    originalSource: image.src,      // Use the `src` string from the object
    alt:  "",       // Fallback to an empty string if `altText` doesn't exist
  }));

  // Add variants based on available sizes
  hit.all_sizes_in_stock_array.forEach((size) => {
    // Extract color from title by splitting at '-' and trimming whitespace
    const color = hit.title.split('-')[1]?.trim() || 'Unico';

    product.variants.push({
      title: `${hit.title} / ${size}`, // Include size in the title
      sku: `${hit.sku}-${size}`, // Make SKU unique per size
      price: processedPrice,
      inventoryQuantities: [
        {
          availableQuantity: 999, // Adjust based on logic
          locationId: `gid://shopify/Location/${locationId}`,
        },
      ],
      options: [color, size], // Options include color and size
    });
  });

  return { product, media }; // Return both product and media.
}