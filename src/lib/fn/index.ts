import { ApiResponse } from "../../types";

export async function fetchShopifyCollection(queryString: string, body: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `https://xn5vepvd4i-dsn.algolia.net/1/indexes/*/queries?${queryString}`, 
      {
        method: "POST",
        headers: {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded",
          "pragma": "no-cache",
          "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "Referer": "https://www.fashionnova.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json: ApiResponse = await response.json();

    // Check if the response contains results and hits
    if (!json.results || json.results.length === 0 || json.results[0].hits.length === 0) {
      throw new Error("No results found");
    }

    // Return the parsed JSON
    return json;
  } catch (error) {
    console.error("Error fetching Algolia results:", error);
    throw new Error("Lo siento, no pudimos encontrar la colección de FashionNova. Por favor prueba con otro link.");
  }
}

export function createAlgoliaFetchParams(urlStr: string, page: number) {
  // Our static query parameters:
  const queryString =
    "x-algolia-agent=Algolia%20for%20JavaScript%20(4.24.0)%3B%20Browser%20(lite)%3B%20instantsearch.js%20(4.73.4)%3B%20react%20(18.3.1)%3B%20react-instantsearch%20(7.12.4)%3B%20react-instantsearch-core%20(7.12.4)%3B%20JS%20Helper%20(3.22.3)"
    + "&x-algolia-api-key=188b909286594fc5b7adadce2548c56e"
    + "&x-algolia-application-id=XN5VEPVD4I";

  // Parse the input URL
  const urlObj = new URL(urlStr);

  // Extract path parts (e.g., "/collections/mens-jeans" => ["collections","mens-jeans"])
  const pathParts = urlObj.pathname.split("/").filter(Boolean);
  // For example, if pathParts = ["collections","mens-pants-1"], 
  // then collectionName is "mens-pants-1"
  const collectionName = pathParts[1] || "mens-jeans";

  // We'll store the search query (if any) separately
  let searchQuery = "";

  // We'll build facetFilters from *all* query params except “query”, etc.
  // e.g. ?named_tags.occasion=Office%2CHoliday%20Party => 
  //   [ ["named_tags.occasion:Office", "named_tags.occasion:Holiday Party"] ]
  const facetFilters: string[][] = [];

  // Iterate over all query params
  for (const [key, value] of urlObj.searchParams.entries()) {
    if (key === "query") {
      // This is the search term
      searchQuery = decodeURIComponent(value);
      continue;
    }
    // If you want to skip certain param keys entirely, you can do so here:
    // if (key === "page" || key === "collections") continue;
    //
    // Otherwise, treat it as a facet: split on commas, decode, and build sub-array.
    const decoded = decodeURIComponent(value); 
    const parts = decoded.split(","); 
    if (parts.length > 0) {
      // Build subarray like ["named_tags.occasion:Office", "named_tags.occasion:Club", ...]
      const subFilters = parts.map(part => `${key}:${part}`);
      facetFilters.push(subFilters);
    }
  }

  // Encode the facetFilters back into a URL-safe string
  const facetFiltersStr = encodeURIComponent(JSON.stringify(facetFilters));

  // Build the `params` string for the first request:
  // If there's a `searchQuery`, include `&query=...`
  const firstRequestParams = 
    `analyticsTags=%5B%22collection%22%2C%22${collectionName}%22%2C%22desktop%22%5D`
    + `&attributesToRetrieve=%5B%22*%22%5D`
    + `&distinct=1`
    + `&facetFilters=${facetFiltersStr}`
    + `&facetingAfterDistinct=true`
    + `&facets=%5B%22all_sizes_in_stock_array%22%2C%22named_tags.bottom_length%22%2C%22named_tags.bottom_style%22%2C%22named_tags.category%22%2C%22named_tags.deals%22%2C%22named_tags.detail%22%2C%22named_tags.fabric%22%2C%22named_tags.occasion%22%2C%22named_tags.print%22%2C%22named_tags.wash%22%2C%22price_range%22%2C%22tags%22%5D`
    + `&filters=available_markets%3Aus%20AND%20collections%3A${collectionName}%20AND%20any_variant_inventory_available%3Atrue`
    + `&highlightPostTag=__%2Fais-highlight__`
    + `&highlightPreTag=__ais-highlight__`
    + `&hitsPerPage=120`
    + `&maxValuesPerFacet=1000`
    + `&page=${page - 1}`
    + `&personalizationImpact=0`
    + `&ruleContexts=%5B%22collection%22%2C%22${collectionName}%22%5D`
    + (searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "");

  // Second request (for facets, etc.) – you can include the same logic if needed
  const secondRequestParams =
    `analytics=false`
    + `&analyticsTags=%5B%22collection%22%2C%22${collectionName}%22%2C%22desktop%22%5D`
    + `&attributesToRetrieve=%5B%22*%22%5D`
    + `&clickAnalytics=false`
    + `&distinct=1`
    + `&facetingAfterDistinct=true`
    + `&facets=price_range`
    + `&filters=available_markets%3Aus%20AND%20collections%3A${collectionName}%20AND%20any_variant_inventory_available%3Atrue`
    + `&highlightPostTag=__%2Fais-highlight__`
    + `&highlightPreTag=__ais-highlight__`
    + `&hitsPerPage=120`
    + `&maxValuesPerFacet=1000`
    + `&page=${page - 1}`
    + `&personalizationImpact=0`
    + `&ruleContexts=%5B%22collection%22%2C%22${collectionName}%22%5D`
    + (searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "");

  // Construct final body object
  const bodyObject = {
    requests: [
      {
        indexName: "products_new_ranking_test",
        params: firstRequestParams
      },
      {
        indexName: "products_new_ranking_test",
        params: secondRequestParams
      }
    ]
  };

  // Return an object so you can do:
  // fetch(`url?${queryString}`, { headers, body })
  return {
    queryString,
    body: JSON.stringify(bodyObject)
  };
}