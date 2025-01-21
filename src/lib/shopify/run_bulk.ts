import axios from "axios";
import { domainMap, STORE_TOKENS } from "../utils/maps";

interface BulkOperationRunMutationResponse {
  data: {
    bulkOperationRunMutation: {
      bulkOperation: {
        id: string;
        url: string;
        status: string;
      } | null; // Allow bulkOperation to be null
      userErrors: Array<{
        message: string;
        field: string[];
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

export async function runBulkOperation(
  pathToFile: string,
  tienda: string,
  apiVersion: string
): Promise<string | undefined> {
  const mutation = `
mutation {
  bulkOperationRunMutation(
    mutation: "mutation call($product: ProductInput!, $media: [CreateMediaInput!]) { 
      productCreate(input: $product, media: $media) { 
        product {
          id
          title
          variants(first: 10) {
            edges {
              node {
                id
                title
                inventoryQuantity
              }
            }
          }
        } 
        userErrors { 
          message 
          field 
        } 
      } 
    }",
    stagedUploadPath: "${pathToFile}"
  ) {
    bulkOperation {
      id
      url
      status
    }
    userErrors {
      message
      field
    }
  }
}
  `;

  const token = STORE_TOKENS[tienda.toUpperCase()];
  const filePrefix = domainMap[tienda.toUpperCase()] || "default";

  if (!token) {
    throw new Error(`Invalid shop domain: ${tienda}`);
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };

  const url = `https://${filePrefix}.myshopify.com/admin/api/${apiVersion}/graphql.json`;

  try {
    const response = await axios.post<BulkOperationRunMutationResponse>(
      url,
      { query: mutation },
      { headers }
    );

    const mutationResult = response.data.data.bulkOperationRunMutation;

    // Handle userErrors
    if (mutationResult.userErrors?.length > 0) {
      console.error(
        "User errors in runBulkOperation:",
        mutationResult.userErrors
      );
      throw new Error(
        `Bulk operation failed with user errors: ${JSON.stringify(
          mutationResult.userErrors
        )}`
      );
    }

    // Check if bulkOperation is null
    if (!mutationResult.bulkOperation) {
      console.error(
        "Bulk operation not created. Response:",
        JSON.stringify(mutationResult, null, 2)
      );
      throw new Error("Bulk operation not created.");
    }

    // Return the bulk operation ID
    return mutationResult.bulkOperation.id;
  } catch (error: any) {
    console.error(
      "Error in runBulkOperation:",
      error.response?.data || error.message
    );
    throw error;
  }
}