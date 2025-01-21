import axios from "axios";
import fs from "fs/promises";
import FormData from "form-data";
import { domainMap } from "../utils/maps";

export async function uploadFileToShopify(
  stagedTarget: {
    url: string;
    parameters: Array<{ name: string; value: string }>;
  },
  filePath: string,
  shopDomain: string,
  maxRetries = 3
): Promise<number> {
  try {
    console.log("Upload file:", filePath);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Read file contents
        const fileContent = await fs.readFile(filePath);

        // Create FormData object
        const formData = new FormData();
        stagedTarget.parameters.forEach((param) => {
          formData.append(param.name, param.value);
        });

        // Determine file name based on shop domain
        const filePrefix = domainMap[shopDomain.toUpperCase()] || "default";
        const fileName = `${filePrefix}.jsonl`;

        formData.append("file", fileContent, fileName);

        // Perform file upload
        const uploadResponse = await axios.post(stagedTarget.url, formData, {
          headers: formData.getHeaders(),
        });

        console.log("File upload response:", uploadResponse.status);
        return uploadResponse.status;
      } catch (error: any) {
        console.error(`Attempt ${attempt} - Error uploading file:`, error.message);

        // Retry for specific error codes
        if (
          error.code === "ETIMEDOUT" ||
          error.code === "ECONNABORTED" ||
          error.response?.status === 500 || // Handle server errors
          error.response?.status === 502 || // Handle bad gateway
          error.response?.status === 503 // Handle service unavailable
        ) {
          console.log(`Attempt ${attempt} - Retryable error occurred. Retrying...`);

          // Optional: Add an exponential backoff delay
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));

          continue; // Retry the upload
        }
        // If non-retryable error, throw it
        throw error;
      }
    }

    console.log("Upload failed after maximum retries");
    return 0; // Return a status indicating failure
  } catch (error: any) {
    console.error("Upload process failed:", error.message);
    throw error; // Propagate the error
  }
}