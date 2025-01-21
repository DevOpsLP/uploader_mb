import fs from 'fs/promises';
import path from 'path';
import { createStagedUpload } from './create_stage';
import { uploadFileToShopify } from './upload_file_to_shopify';
import { runBulkOperation } from './run_bulk';
import { getBulkOperationStatus } from './bulk_status';
import { domainMap } from '../utils/maps';

export async function splitJsonlFile(filePath: string, maxFileSizeInMB: number): Promise<string[]> {
  const maxBytes = maxFileSizeInMB * 1024 * 1024;
  const chunkFilePaths: string[] = [];
  const fileHandle = await fs.open(filePath, "r");
  const bufferSize = 1024 * 1024; // Read in chunks of 1 MB
  const buffer = Buffer.alloc(bufferSize);

  let fileNumber = 1;
  let currentChunk: string[] = [];
  let currentFileSize = 0;

  try {
    let bytesRead = 0;
    let leftover = "";

    while (true) {
      const result = await fileHandle.read(buffer, 0, bufferSize, null);
      bytesRead = result.bytesRead; // Access the bytesRead property
      if (bytesRead === 0) break; // End of file

      const chunk = leftover + buffer.toString("utf8", 0, bytesRead);
      const lines = chunk.split("\n");

      leftover = lines.pop() || ""; // Save the last incomplete line to process later

      for (const line of lines) {
        const lineSize = Buffer.byteLength(line + "\n");
        if (currentFileSize + lineSize > maxBytes) {
          const chunkPath = `${filePath}.${fileNumber}.jsonl`;
          await fs.writeFile(chunkPath, currentChunk.join("\n"), { flag: "w" });
          chunkFilePaths.push(chunkPath);
          currentChunk = [];
          currentFileSize = 0;
          fileNumber++;
        }
        currentChunk.push(line);
        currentFileSize += lineSize;
      }
    }

    // Handle the leftover line and finalize the last chunk
    if (leftover) {
      const lineSize = Buffer.byteLength(leftover + "\n");
      if (currentFileSize + lineSize > maxBytes) {
        const chunkPath = `${filePath}.${fileNumber}.jsonl`;
        await fs.writeFile(chunkPath, currentChunk.join("\n"), { flag: "w" });
        chunkFilePaths.push(chunkPath);
        currentChunk = [];
        fileNumber++;
      }
      currentChunk.push(leftover);
    }

    if (currentChunk.length > 0) {
      const chunkPath = `${filePath}.${fileNumber}.jsonl`;
      await fs.writeFile(chunkPath, currentChunk.join("\n"), { flag: "w" });
      chunkFilePaths.push(chunkPath);
    }
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  } finally {
    await fileHandle.close();
  }

  return chunkFilePaths;
}
  
export async function processFile(
  tienda: string,
  apiVersion: string
): Promise<boolean> {
  try {
    // Dynamically determine the filePath using tienda and domainMap
    const filePrefix = domainMap[tienda.toUpperCase()] || "default";
    const filePath = path.join(process.cwd(), `${filePrefix}.jsonl`);

    const stats = await fs.stat(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`File Size for ${tienda}: ${fileSizeInMB} MB`);

    if (fileSizeInMB > 20) {
      console.log("Splitting file into chunks...");
      const chunkFiles = await splitJsonlFile(filePath, 20);

      for (const chunkFilePath of chunkFiles) {
        console.log(`Processed chunk: ${chunkFilePath}`);
        await processChunk(chunkFilePath, tienda, apiVersion);
        // Optionally, delete the chunk file after processing
        await fs.unlink(chunkFilePath);
      }
    } else {
      await processChunk(filePath, tienda, apiVersion);
    }

    console.log("File processing completed successfully.");
    return true; // Success
  } catch (error: any) {
    console.error("Error processing file:", error.message);
    return false; // Failure
  }
}

export async function processChunk(
  chunkFilePath: string,
  tienda: string,
  apiVersion: string,
): Promise<void> {
  try {
    const stagedTarget = await createStagedUpload(chunkFilePath, tienda, apiVersion);
    if (!stagedTarget) {
      throw new Error("Failed to create staged upload.");
    }

    const uploadedStatus = await uploadFileToShopify(stagedTarget, chunkFilePath, tienda);
    if (uploadedStatus < 200 || uploadedStatus >= 300) {
      throw new Error(`File upload failed with status: ${uploadedStatus}`);
    }

    const stagedFilePath = stagedTarget.parameters.find((param: any) => param.name === "key")?.value;
    if (!stagedFilePath) {
      throw new Error("Staged upload file path not found.");
    }

    const bulkID = await runBulkOperation(stagedFilePath, tienda, apiVersion);
    if (!bulkID) {
      throw new Error("Bulk operation ID not returned.");
    }

    let bulkStatus = await getBulkOperationStatus(tienda, apiVersion, bulkID);
    while (bulkStatus !== "COMPLETED") {
      console.log(`Bulk operation status: ${bulkStatus}`);
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait for 30 seconds
      bulkStatus = await getBulkOperationStatus(tienda, apiVersion, bulkID);
    }

    console.log(`Bulk operation completed successfully for tienda: ${tienda}`);
  } catch (error: any) {
    console.error(`Error in processChunk: ${error.message}`);
    throw error;
  }
}