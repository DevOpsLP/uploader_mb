import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { delay } from "../utils/utils";

export async function scrapeFashionNovaSizeChart(
  handle: string
): Promise<Array<Record<string, string>>> {
  const url = `https://www.fashionnova.com/products/${handle}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1366,
      height: 768,
    },
  });

  const page = await browser.newPage();

  try {
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    // Attempt to click the close button if it exists
    try {
      const closeSelector = 'button[data-click="close"]';
      if ((await page.$(closeSelector)) !== null) {
        await page.click(closeSelector);
        console.log("Clicked on the close button.");
      }
    } catch (error) {
      console.error("Error clicking the close button:", error);
    }

    // Selector for the size chart button
    const sizeChartButtonSelector = 'button[data-tag-event="e_viewSizeChart"]';

    // Click the size chart button
    try {
      await page.waitForSelector(sizeChartButtonSelector, { visible: true });

      const buttonClicked = await page.evaluate((selector) => {
        const button = document.querySelector(selector) as HTMLElement;
        if (button) {
          button.click();
          return true;
        }
        return false;
      }, sizeChartButtonSelector);

      if (buttonClicked) {
        console.log("Size Chart Button Clicked");
      } else {
        console.error("Size Chart Button not found in the DOM");
      }
    } catch (error) {
      console.error("Error clicking the size chart button:", error);
      return [];
    }

    await delay(1000);

    // Click the "Switch to centimeters" button
    const switchToCmButtonSelector = 'button[aria-label="Switch to centimeters"]';
    try {
      await page.waitForSelector(switchToCmButtonSelector, { visible: true });
      await page.click(switchToCmButtonSelector);
      console.log('"Switch to centimeters" Button Clicked');
    } catch (error) {
      console.error('Error clicking the "Switch to centimeters" button:', error);
      return [];
    }

    // Selector for the size guide table
    const sizeGuideTableSelector = "div.overflow-x-auto.size-guide-scrollbar table";

    // Wait for the table to load
    await page.waitForSelector(sizeGuideTableSelector, { visible: true });

    // Extract the HTML content of the table
    const htmlContent = await page.$eval(sizeGuideTableSelector, (el) => el.outerHTML);

    // Parse the HTML with Cheerio
    const $ = cheerio.load(htmlContent);

    let headers: string[] = [];
    const size_chart: Array<Record<string, string>> = [];

    // Mapping English headers to Spanish
    const keyMapping: Record<string, string> = {
      Size: "Talla",
      Waist: "Cintura",
      Hips: "Caderas",
    };

    // Extract table headers
    $("tbody > tr:first-child")
      .find("td")
      .each((_, elem) => {
        const header = $(elem).text().trim();
        headers.push(keyMapping[header] || header); // Translate headers if a mapping exists
      });

    // Extract table rows (excluding header row)
    $("tbody > tr").each((rowIndex, rowElem) => {
      if (rowIndex === 0) return; // Skip the header row

      let sizeObject: Record<string, string> = {};
      $(rowElem)
        .find("td")
        .each((colIndex, colElem) => {
          const key = headers[colIndex];
          const value = $(colElem).text().trim();
          sizeObject[key] = value;
        });

      size_chart.push(sizeObject);
    });

    console.log("Extracted size_chart:", size_chart);

    return size_chart;
  } catch (error) {
    console.error("Error during scraping:", error);
    return [];
  } finally {
    await browser.close();
  }
}