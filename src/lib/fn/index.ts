import { ApiResponse } from "../../types";

export async function fetchFNCollection(queryString: string, body: string): Promise<ApiResponse> {
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
  // Convert page to 0-based
  page = Math.max(page - 1, 0);

  const queryString =
    "x-algolia-agent=Algolia%20for%20JavaScript%20(4.24.0)%3B%20Browser%20(lite)%3B%20instantsearch.js%20(4.73.4)%3B%20react%20(18.3.1)%3B%20react-instantsearch%20(7.12.4)%3B%20react-instantsearch-core%20(7.12.4)%3B%20JS%20Helper%20(3.22.3)" +
    "&x-algolia-api-key=188b909286594fc5b7adadce2548c56e" +
    "&x-algolia-application-id=XN5VEPVD4I";

  const urlObj = new URL(urlStr);
  const pathParts = urlObj.pathname.split("/").filter(Boolean);
  const collectionName = pathParts[1] || "mens-jeans";

  let searchQuery = "";
  let indexName = "products_price_asc";
  const facetFilters: string[][] = [];
  const facetKeys = new Set<string>();

  const fixedFacets = [
    "all_sizes_in_stock_array",
    "named_tags.category",
    "named_tags.detail",
    "named_tags.fabric",
    "named_tags.fit_type",
    "named_tags.neckline",
    "named_tags.occasion",
    "named_tags.print",
    "named_tags.sleeve",
    "named_tags.top_length",
    "named_tags.top_style",
    "price_range",
    "tags"
  ];

  for (const [key, value] of urlObj.searchParams.entries()) {
    if (key === "query") {
      searchQuery = decodeURIComponent(value);
    } else if (key === "itemsPerPage" || key === "mqs") {
      continue;
    } else if (key === "page") {
      const parsedPage = parseInt(value, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage - 1;
      }
    } else if (key === "sort") {
      indexName = decodeURIComponent(value);
    } else {
      const decoded = decodeURIComponent(value);
      const parts = decoded.split(",");
      if (parts.length > 0) {
        const subFilters = parts.map(part => `${key}:${part}`);
        facetFilters.push(subFilters);
        facetKeys.add(key);
      }
    }
  }

  const facetFiltersStr = encodeURIComponent(JSON.stringify(facetFilters));
  const facetsParam = encodeURIComponent(JSON.stringify(fixedFacets));

  const mainRequestParams =
    `analyticsTags=%5B%22collection%22%2C%22${collectionName}%22%2C%22desktop%22%5D` +
    `&attributesToRetrieve=%5B%22*%22%5D` +
    `&distinct=1` +
    `&facetFilters=${facetFiltersStr}` +
    `&facetingAfterDistinct=true` +
    `&facets=${facetsParam}` +
    `&filters=available_markets%3Aus%20AND%20collections%3A${collectionName}%20AND%20any_variant_inventory_available%3Atrue` +
    `&highlightPostTag=__%2Fais-highlight__` +
    `&highlightPreTag=__ais-highlight__` +
    `&hitsPerPage=120` +
    `&maxValuesPerFacet=1000` +
    `&page=${page}` +
    `&personalizationImpact=0` +
    `&ruleContexts=%5B%22collection%22%2C%22${collectionName}%22%5D` +
    (searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "");

  const additionalRequests = Array.from(facetKeys).map(key => {
    const filteredFacetFilters = facetFilters.filter(subArr => {
      const firstKey = subArr[0]?.split(':')[0];
      return firstKey !== key;
    });

    return {
      indexName: indexName,
      params: [
        `analytics=false`,
        `analyticsTags=%5B%22collection%22%2C%22${collectionName}%22%2C%22desktop%22%5D`,
        `attributesToRetrieve=%5B%22*%22%5D`,
        `clickAnalytics=false`,
        `distinct=1`,
        `facetFilters=${encodeURIComponent(JSON.stringify(filteredFacetFilters))}`,
        `facetingAfterDistinct=true`,
        `facets=${encodeURIComponent(key)}`,
        `filters=available_markets%3Aus%20AND%20collections%3A${collectionName}%20AND%20any_variant_inventory_available%3Atrue`,
        `highlightPostTag=__%2Fais-highlight__`,
        `highlightPreTag=__ais-highlight__`,
        `hitsPerPage=0`,
        `maxValuesPerFacet=1000`,
        `page=0`,
        `personalizationImpact=0`,
        `ruleContexts=%5B%22collection%22%2C%22${collectionName}%22%5D`,
        searchQuery ? `query=${encodeURIComponent(searchQuery)}` : ""
      ].filter(p => p).join('&')
    };
  });

  const bodyObject = {
    requests: [
      {
        indexName: indexName,
        params: mainRequestParams
      },
      ...additionalRequests
    ]
  };

  return {
    queryString,
    body: JSON.stringify(bodyObject)
  };
}