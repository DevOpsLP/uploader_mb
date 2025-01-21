import * as cheerio from "cheerio";

/**
 * Fetches the HTML content of a product page and extracts image URLs.
 * 
 * @param handle - The product handle from FashionNova's website.
 * @returns A Promise resolving to an array of image URLs.
 */
export async function get_images(handle: string): Promise<{ images: string[]; description: string }> {
  const url = `https://www.fashionnova.com/es-mx/products/${handle}`;
  try {
    // Fetch the product page HTML
    const response = await fetch(url,{
        method: 'GET',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          priority: 'u=0, i',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch page for handle: ${handle}. Status: ${response.status}`);
    }

    const html = await response.text();
    // Load the HTML into Cheerio
 
    const $ = cheerio.load(html);

    const scriptTag = $('script')
      .filter((_, element) => {
        const scriptContent = $(element).html();
        return scriptContent !== null && scriptContent.includes('window.__remixContext');
      })
      .first();

    const scriptContent = scriptTag.html();
    if (!scriptContent) {
      throw new Error("Could not find the script containing __remixContext.");
    }

    const jsonString = scriptContent
      .split('window.__remixContext =')[1]
      .split('};')[0]
      .trim() + '}';

    const remixContext = JSON.parse(jsonString);
    const loaderData = remixContext.state?.loaderData;
    const routeData = loaderData?.['routes/($locale).products/$handle/_route'];
    if (!routeData?.product) {
      throw new Error("Product data not found in Remix context.");
    }
    
    const images = routeData.product.images?.nodes?.map((node: any) => ({
      src: node.url,
      altText: " "
    })) || [];
    const description = routeData.product.description || "No description available.";
    
    if (routeData?.product?.swatches?.value) {
      const swatchesValue = routeData.product.swatches.value;
    
      // Split by comma to get individual swatch entries
      const swatchEntries = swatchesValue.split(',');
    
      // Extract handles from each swatch entry by splitting on ':' and taking the first part for the new handle
      const handles = swatchEntries.map((entry: any) => entry.split(':')[0]);
    }

    return { images, description };
  } catch (error) {
    console.error(`Error fetching images or description for handle: ${handle}`, error);
    return { images: [], description: "No description available." };
  }
}
