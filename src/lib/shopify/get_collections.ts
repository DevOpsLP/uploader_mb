import axios from "axios"
import { ShopifyCollectionsResponse } from "../../types";
import { API_VERSION, domainMap, STORE_TOKENS } from "../utils/maps";

export async function getCollectionID(
    tienda: string,
    collection: string
  ): Promise<string | null> {
    const shopDomain = domainMap[tienda]; // e.g. 'ropamujerusa'
    const storeToken = STORE_TOKENS[tienda]; // e.g. process.env.MUYBONITA_TOKEN
    if (!shopDomain || !storeToken) {
      console.error('Invalid shop domain or token:', { shopDomain, storeToken });
      return null;
    }
  
    const endpoint = `https://${shopDomain}.myshopify.com/admin/api/${API_VERSION}/graphql.json`;
  
    const graphqlQuery = {
      query: `
        {
          collections(first: 10, query: "title:${collection}") {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      `,
    };
  
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': storeToken,
    };
  
    try {
      const response = await axios.post<ShopifyCollectionsResponse>(
        endpoint,
        graphqlQuery,
        { headers }
      );
      console.log('Full Response:', JSON.stringify(response.data, null, 2));
      
      const edges = response.data?.data?.collections?.edges || [];
      console.log('Edges:', edges);
  
      for (const edge of edges) {
        if (edge.node.title.trim().toLowerCase() === collection.trim().toLowerCase()) {
          return edge.node.id;
        }
      }
      return null; // Not found
    } catch (err: any) {
      console.error('Error making GraphQL query:', err.response?.data || err.message);
      throw err;
    }
  }


  