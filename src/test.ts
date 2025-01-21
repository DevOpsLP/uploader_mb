fetch("https://xn5vepvd4i-1.algolianet.com/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.24.0)%3B%20Browser%20(lite)%3B%20instantsearch.js%20(4.73.4)%3B%20react%20(18.3.1)%3B%20react-instantsearch%20(7.12.4)%3B%20react-instantsearch-core%20(7.12.4)%3B%20JS%20Helper%20(3.22.3)&x-algolia-api-key=188b909286594fc5b7adadce2548c56e&x-algolia-application-id=XN5VEPVD4I", {
  "headers": {
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
  "body": "{\"requests\":[{\"indexName\":\"products\",\"params\":\"ruleContexts=%5B%22collection%22%2C%22maxi-dresses%22%5D&analyticsTags=%5B%22collection%22%2C%22maxi-dresses%22%2C%22desktop%22%5D&facets=%5B%22tags%22%2C%22product_type%22%2C%22inventory_available%22%2C%22price_range%22%2C%22named_tags.color%22%2C%22named_tags.occasion%22%2C%22named_tags.bottom_style%22%2C%22named_tags.sleeve%22%2C%22named_tags.fabric%22%2C%22named_tags.neckline%22%2C%22named_tags.detail%22%2C%22named_tags.print%22%2C%22options.size%22%5D&facetFilters=%5B%5B%22price_range%3A10%3A25%22%2C%22price_range%3A0%3A10%22%5D%5D&filters=available_markets%3Aus%20AND%20collections%3Amaxi-dresses%20AND%20any_variant_inventory_available%3Atrue&distinct=1&hitsPerPage=0&facetingAfterDistinct=false&maxValuesPerFacet=1000\"},{\"indexName\":\"products\",\"params\":\"ruleContexts=%5B%22collection%22%2C%22maxi-dresses%22%5D&analyticsTags=%5B%22collection%22%2C%22maxi-dresses%22%2C%22desktop%22%5D&filters=available_markets%3Aus%20AND%20collections%3Amaxi-dresses%20AND%20any_variant_inventory_available%3Atrue%20AND%20inventory_available%3Atrue&facetFilters=%5B%5D&distinct=0&hitsPerPage=0&facetingAfterDistinct=false&facets=%5B%22price_range%22%5D&maxValuesPerFacet=1000\"}]}",
  "method": "POST"
}).then(async res =>await console.log(res.json()));