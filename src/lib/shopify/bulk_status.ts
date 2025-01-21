import axios from "axios";
import { domainMap, STORE_TOKENS } from "../utils/maps";
interface BulkOperationStatusResponse {
    data: {
      node: {
        status: string;
      };
    };
    errors?: Array<{ message: string }>;
  }

export async function getBulkOperationStatus(
  tienda: string,
  apiVersion: string,
  id: string
): Promise<string> {

    const filePrefix = domainMap[tienda.toUpperCase()] || 'default';
  
  const endpoint = `https://${filePrefix}.myshopify.com/admin/api/${apiVersion}/graphql.json`;

  const graphqlQuery = {
    query: `{
      node(id: "${id}") {
        ... on BulkOperation {
          status
        }
      }
    }`,
  };

  // Fetch token dynamically from STORE_TOKENS
  const token = STORE_TOKENS[tienda.toUpperCase()];
  if (!token) {
    throw new Error(`Invalid shop domain: ${tienda}`);
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };

  try {
    const response = await axios.post<BulkOperationStatusResponse>(
      endpoint,
      graphqlQuery,
      { headers }
    );

    // Access and validate response data
    if (response.data.errors) {
      console.error("GraphQL Errors:", response.data.errors);
      throw new Error("Error in GraphQL query execution.");
    }

    const status = response.data.data.node.status;
    return status || "COMPLETED";
  } catch (error: any) {
    console.error("Error making GraphQL query:", error.response?.data || error.message);
    throw error;
  }
}