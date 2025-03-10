import { Router, Request, Response, NextFunction } from 'express';
import { FormBody, ProductList, ProductWithMedia } from '../types';
import { createAlgoliaFetchParams, fetchFNCollection } from '../lib/fn';
import { scrapeFashionNovaSizeChart } from '../lib/fn/get-size-chart';
import { delay, transformHitToProduct } from '../lib/utils/utils';
import { getCollectionID } from '../lib/shopify/get_collections';
import { processFile } from '../lib/shopify/proces_file';
import { API_VERSION } from '../lib/utils/maps';
import { cleanJsonlFile, saveProductAndMediaAsJsonl } from '../lib/utils/save_jsonl';

const router: Router = Router();

// Serve the form HTML
router.get('/', (req: Request, res: Response): void => {
  res.sendFile(`${__dirname}/../index.html`);
});

// Middleware to validate inputs
router.post(
  '/',
  (req: Request<{}, {}, FormBody>, res: Response, next: NextFunction): void => {
    const { url } = req.body;

    // Validate URL
    try {
      const validUrl = new URL(url); // Throws an error if not a valid URL
      if (!validUrl.href.includes('fashionnova')) {
        res.status(400).send('URL must contain the word "fashionnova".');
        return;
      }
    } catch {
      res.status(400).send('Invalid URL.');
      return;
    }

    // Validation passed, proceed to the next middleware
    next();
  }
);


// Middleware to fetch and replace `coleccion` and `coleccion2` with their `collectionID`
router.post(
  '/',
  async (req: Request<{}, {}, FormBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { coleccion, coleccion2, tienda } = req.body;
      console.log(req.body)
      if (!tienda || !coleccion) {
        res.status(400).json({ error: 'Missing required fields: tienda or coleccion.' });
        return;
      }

      // Fetch and replace `coleccion` with its `collectionID`
      const collectionID = await getCollectionID(tienda, coleccion);
      if (!collectionID) {
        res.status(400).json({ error: `Invalid coleccion: ${coleccion}` });
        return;
      }
      req.body.coleccion = collectionID;

      // Fetch and replace `coleccion2` with its `collectionID`, if provided
      if (coleccion2) {
        const collectionID2 = await getCollectionID(tienda, coleccion2);
        if (!collectionID2) {
          res.status(400).json({ error: `Invalid coleccion2: ${coleccion2}` });
          return;
        }
        req.body.coleccion2 = collectionID2;
      }

      next(); // Proceed to the main route handler
    } catch (error: any) {
      console.error('Error in collection middleware:', error);
      res.status(500).json({ error: 'Failed to process collections', details: error.message });
    }
  }
);


// Handle form submission
router.post(
  '/',
  async (req: Request<{}, {}, FormBody>, res: Response): Promise<void> => {
    let { url, coleccion, coleccion2, copUsd, ganancia, page, tienda } = req.body;

    // Convert copUsd and ganancia to numbers
    const storeData = {
      copUsd: parseFloat(copUsd), // Parse copUsd as a number
      ganancia: parseFloat(ganancia) / 100, // Parse ganancia as a number
      tienda, // Keep tienda as is (string)
      collections: [coleccion, coleccion2]
    };

    // Use storeData when calling transformHitToProduct
    console.log('Form Data:', { url, coleccion, coleccion2, copUsd, ganancia, page });

    try {
      // Generate query string and body using the provided function
      // Wrap the logic in a loop to fetch all pages
      let allHits: any[] = []; // Collect hits from all pages

      for (let currentPage = 1; currentPage <= page; currentPage++) {
        // Generate query string and body for the current page
        const { queryString, body } = createAlgoliaFetchParams(url, currentPage);

        // Fetch the data for the current page
        const response = await fetchFNCollection(queryString, body);

        // Get the first item from "results" in the response
        const firstResult = response?.results?.[0];

        if (!firstResult) {
          throw new Error(`No results found for page ${currentPage} in the Algolia response.`);
        }

        // Extract the hits array for the current page
        const pageHits = firstResult?.hits;

        if (!pageHits || pageHits.length === 0) {
          console.warn(`No hits found for page ${currentPage}. Skipping.`);
          continue; // Skip this iteration if no hits are found
        }

        // Add the hits from this page to the allHits array
        allHits = allHits.concat(pageHits);
      }

      // Proceed with the existing flow
      if (allHits.length === 0) {
        throw new Error('No hits found in any of the pages.');
      }

      // Use the first hit for the size chart
      const sizeChart = await scrapeFashionNovaSizeChart(allHits[0].handle);



      // Transform hits into ProductList with 1-second delay
      const productMediaList: ProductWithMedia[] = (
        await Promise.all(
          allHits.map(async (hit) => {
            // Add a 1-second delay before processing each hit
            await delay(1000); // 1-second delay
            return transformHitToProduct(hit, sizeChart, storeData);
          })
        )
      ).filter(
        (pm) => Object.keys(pm.product).length > 0 // Filter out empty product objects
      );

      // The `productMediaList` now contains all products from all pages
      for (const { product, media } of productMediaList) {
        // Now pass all three: product, media, and tienda
        await saveProductAndMediaAsJsonl(product, media, tienda);
      }

      const isSuccess = await processFile(tienda, API_VERSION);

      if (isSuccess) {
        cleanJsonlFile(tienda)
        res.status(200).json({ message: "File processed successfully.", success: true });
      } else {
        cleanJsonlFile(tienda)
        res.status(500).json({ message: "File processing failed.", success: false });
      }
    } catch (error: any) {
      console.error('Error during Algolia fetch or processing:', error);
      cleanJsonlFile(tienda)
      // Return the error to the frontend
      res.status(500).json({
        error: 'Lo siento, no pudimos encontrar la colección de FashionNova. Por favor prueba con otro link',
        details: error.message,
      });
    }
  }
);

export default router;