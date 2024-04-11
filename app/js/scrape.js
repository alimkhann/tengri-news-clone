const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const url = "https://tengrinews.kz/";
const limit = 50; // Limit for the number of scroll articles to scrape
const imageDir = "./images/scraped-images";

const downloadImage = async (page, imageUrl, filename) => {
  console.log(`Downloading image: ${filename}`);
  const viewSource = await page.goto(imageUrl);
  fs.writeFileSync(path.join(imageDir, filename), await viewSource.buffer());
  console.log(`Image downloaded: ${filename}`);
};

const cleanupImages = () => {
  console.log("Cleaning up unnecessary images...");
  const imageFilenames = [];
  // Extract image filenames from JSON
  const allArticles = JSON.parse(fs.readFileSync("./dist/articles_data.json"));
  for (const article of allArticles.gridView) {
    if (article.imageUrl) {
      const imageName = article.imageUrl.split("/").pop();
      imageFilenames.push(imageName);
    }
  }

  // Delete unnecessary images
  const files = fs.readdirSync(imageDir);
  for (const file of files) {
    if (!imageFilenames.includes(file)) {
      fs.unlinkSync(path.join(imageDir, file));
      console.log(`Deleted ${file}`);
    }
  }
  console.log("Image cleanup complete.");
};

const scrapeTengrinews = async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: "./dist/tmp",
  });
  const page = await browser.newPage();

  // Set up browser environment for faster page load
  console.log("Setting up browser environment...");
  const setupStartTime = Date.now();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.resourceType() === "image" ||
      request.resourceType() === "stylesheet"
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
  const setupEndTime = Date.now();
  console.log(
    `Browser environment setup complete (${
      (setupEndTime - setupStartTime) / 1000
    } seconds)`
  );

  // Navigate to the website
  console.log(`Navigating to ${url}...`);
  const navigationStartTime = Date.now();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const navigationEndTime = Date.now();
  console.log(
    `Navigation complete (${
      (navigationEndTime - navigationStartTime) / 1000
    } seconds)`
  );

  // Scrape grid view news articles
  console.log("Scraping grid view news articles...");
  const gridStartTime = Date.now();
  const gridArticles = await page.evaluate(async (url) => {
    const articles = [];
    const items = document.querySelectorAll(".main-news_super_item");
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const titleElement = item.querySelector(".main-news_super_item_title a");
      const title = titleElement ? titleElement.innerText : "";

      const articleUrlElement = item.querySelector(
        ".main-news_super_item_title a"
      );
      const articleUrl = articleUrlElement ? articleUrlElement.href : "";

      const timeElement = item.querySelector("time");
      const time = timeElement ? timeElement.innerText : "";

      const imageUrlElement = item.querySelector("picture source");
      const imageUrl = imageUrlElement
        ? url + imageUrlElement.getAttribute("srcset")
        : "";

      // Wait for views and comments elements to be visible
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const viewsElement = item.querySelector(".content_item_meta_viewings");
      const views = viewsElement ? viewsElement.innerText.trim() : "";

      const commentsElement = item.querySelector(".content_item_meta_comments");
      const comments = commentsElement ? commentsElement.innerText.trim() : "";

      articles.push({ title, articleUrl, time, imageUrl, views, comments });
    }
    return articles;
  }, url);
  const gridEndTime = Date.now();
  console.log(
    `Grid view scraping complete (${
      (gridEndTime - gridStartTime) / 1000
    } seconds)`
  );

  // Scrape scroll view news articles
  console.log("Scraping scroll view news articles...");
  const scrollStartTime = Date.now();
  const scrollArticles = await page.evaluate(async (limit) => {
    const articles = [];
    const scrollItems = document.querySelectorAll(".main-news_top_item");
    for (let i = 0; i < Math.min(limit, scrollItems.length); i++) {
      const item = scrollItems[i];
      const titleElement = item.querySelector(".main-news_top_item_title a");
      const title = titleElement ? titleElement.innerText : "";

      const articleUrlElement = item.querySelector(
        ".main-news_top_item_title a"
      );
      const articleUrl = articleUrlElement ? articleUrlElement.href : "";

      const timeElement = item.querySelector("time");
      const time = timeElement ? timeElement.innerText : "";

      // Wait for views and comments elements to be visible
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const viewsElement = item.querySelector(".content_item_meta_viewings");
      const views = viewsElement ? viewsElement.innerText.trim() : "";

      const commentsElement = item.querySelector(".content_item_meta_comments");
      const comments = commentsElement ? commentsElement.innerText.trim() : "";

      articles.push({ title, articleUrl, time, views, comments });
    }
    return articles;
  }, limit);
  const scrollEndTime = Date.now();
  console.log(
    `Scroll view scraping complete (${
      (scrollEndTime - scrollStartTime) / 1000
    } seconds)`
  );

  // Combine both sets of articles
  const allArticles = {
    gridView: gridArticles,
    scrollView: scrollArticles,
  };

  // Write data to a JSON file
  console.log("Writing data to JSON file...");
  const jsonWriteStartTime = Date.now();
  fs.writeFileSync(
    "./dist/articles_data.json",
    JSON.stringify(allArticles, null, 2)
  );
  const jsonWriteEndTime = Date.now();
  console.log(
    `JSON file writing complete (${
      (jsonWriteEndTime - jsonWriteStartTime) / 1000
    } seconds)`
  );

  // Download images
  console.log("Downloading images...");
  const imageDownloadStartTime = Date.now();
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
  }

  for (const article of allArticles.gridView) {
    if (article.imageUrl) {
      const imageName = article.imageUrl.split("/").pop();
      await downloadImage(page, article.imageUrl, imageName);
    }
  }
  const imageDownloadEndTime = Date.now();
  console.log(
    `Image downloading complete (${
      (imageDownloadEndTime - imageDownloadStartTime) / 1000
    } seconds)`
  );

  // Clean up unnecessary images
  console.log("Cleaning up images...");
  const cleanupStartTime = Date.now();
  cleanupImages();
  const cleanupEndTime = Date.now();
  console.log(
    `Image cleanup complete (${
      (cleanupEndTime - cleanupStartTime) / 1000
    } seconds)`
  );

  console.log("Closing browser...");
  const browserCloseStartTime = Date.now();
  await browser.close();
  const browserCloseEndTime = Date.now();
  console.log(
    `Browser closed (${
      (browserCloseEndTime - browserCloseStartTime) / 1000
    } seconds)`
  );

  const totalTime = (browserCloseEndTime - setupStartTime) / 1000;
  console.log(`Scraping complete. Total time: ${totalTime} seconds`);
};

const startTime = Date.now();
scrapeTengrinews()
  .catch((error) => {
    console.error("Error during scraping:", error);
  })
  .finally(() => {
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(`Total execution time: ${totalTime} seconds`);
  });

module.exports = scrapeTengrinews;
