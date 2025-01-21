import axios from 'axios';
import fs from 'fs/promises'
import { domainMap, STORE_TOKENS } from '../utils/maps';

// Define the expected response type
interface StagedUploadsCreateResponse {
  data: {
    stagedUploadsCreate: {
      stagedTargets: Array<{
        url: string;
        resourceUrl: string;
        parameters: Array<{
          name: string;
          value: string;
        }>;
      }>;
      userErrors: Array<{
        field: string;
        message: string;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

export async function createStagedUpload(filePath: string, tienda: string, apiVersion: string): Promise<any> {
  const mutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    console.log(`Starting createStagedUpload for tienda: ${tienda}, API Version: ${apiVersion}`);

    // Get file stats to determine size
    const stats = await fs.stat(filePath);
    const fileSizeInBytes = stats.size;
    console.log(`File size for ${filePath}: ${fileSizeInBytes} bytes`);

    // Fetch token and filename using domainMap and STORE_TOKENS
    const token = STORE_TOKENS[tienda.toUpperCase()];
    const filePrefix = domainMap[tienda.toUpperCase()];
    if (!token || !filePrefix) {
      console.error(`Invalid tienda: ${tienda}`);
      throw new Error(`Invalid shop domain: ${tienda}`);
    }

    console.log(`Token and filePrefix resolved: token exists = ${!!token}, filePrefix = ${filePrefix}`);

    const filename = `${filePrefix}.jsonl`;
    const url = `https://${filePrefix}.myshopify.com/admin/api/${apiVersion}/graphql.json`;
    console.log(`Generated URL: ${url}, Filename: ${filename}`);

    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    };

    console.log('Headers:', headers);

    const variables = {
      input: [
        {
          fileSize: `${fileSizeInBytes}`,
          filename: `${filename}`,
          httpMethod: 'POST',
          mimeType: 'application/json',
          resource: 'BULK_MUTATION_VARIABLES',
        },
      ],
    };

    console.log('GraphQL Variables:', JSON.stringify(variables, null, 2));

    // Make GraphQL API request
    const response = await axios.post<StagedUploadsCreateResponse>(
      url,
      { query: mutation, variables },
      { headers }
    );

    console.log('Response received:', JSON.stringify(response.data, null, 2));

    // Access response data safely with types
    if (response.data.errors) {
      console.error('Error creating staged upload:', response.data.errors);
      return null;
    }

    const stagedTarget = response.data.data.stagedUploadsCreate.stagedTargets[0];
    console.log('Staged target:', stagedTarget);
    return stagedTarget;
  } catch (error: any) {
    console.error('Error in createStagedUpload:', {
      message: error.message || error,
      stack: error.stack,
      responseData: error.response?.data,
    });
    throw error;
  }
}