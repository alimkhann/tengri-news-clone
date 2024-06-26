const puppeteer = require("puppeteer");
const fs = require("fs");

const url = "https://tengrinews.kz/";
const limit = 50; // Limit for the number of scroll articles to scrape

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
      const videoElement = item.querySelector("video");
      const imageUrl = imageUrlElement
        ? url + imageUrlElement.getAttribute("srcset")
        : videoElement
        ? url + videoElement.querySelector("source").getAttribute("src")
        : "";

      // Wait for views and comments elements to be visible
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
  console.log("Writing articles data to JSON file...");
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

  console.log("Scraping article details...");
  const articleDetailsStartTime = Date.now();
  const gridArticlesDetails = [];
  for (const article of allArticles.gridView) {
    const details = await scrapeArticleDetails(page, article.articleUrl);
    gridArticlesDetails.push(details);
  }
  const scrollArticlesDetails = [];
  for (const article of allArticles.scrollView) {
    const details = await scrapeArticleDetails(page, article.articleUrl);
    scrollArticlesDetails.push(details);
  }
  const articleDetailsEndTime = Date.now();
  console.log(
    `Article details scraping complete (${
      (articleDetailsEndTime - articleDetailsStartTime) / 1000
    } seconds)`
  );

  // Combine both sets of article details
  const allArticlesDetails = {
    gridViewDetails: gridArticlesDetails,
    scrollViewDetails: scrollArticlesDetails,
  };

  // Write article details to a separate JSON file
  console.log("Writing article details to JSON file...");
  const articleDetailsWriteStartTime = Date.now();
  fs.writeFileSync(
    "./dist/article_details.json",
    JSON.stringify(allArticlesDetails, null, 2)
  );
  const articleDetailsWriteEndTime = Date.now();
  console.log(
    `Article details writing complete (${
      (articleDetailsWriteEndTime - articleDetailsWriteStartTime) / 1000
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

const scrapeArticleDetails = async (page, articleUrl) => {
  console.log(`Scraping article details for: ${articleUrl}`);
  await page.goto(articleUrl, { waitUntil: "domcontentloaded" });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Extract date
  let date = "";
  try {
    date = await page.$eval(".date-time", (element) =>
      element.innerText.trim()
    );
  } catch (error) {
    console.error("Date not found for:", articleUrl);
  }

  // Extract author name
  let authorName = "";
  try {
    authorName = await page.$eval(
      ".content_main_meta_author_item a",
      (element) => element.innerText.trim()
    );
  } catch (error) {
    console.error("Author name not found for:", articleUrl);
  }

  // Extract author photo
  let authorPhoto = "";
  try {
    authorPhoto = await page.$eval(
      ".content_main_meta_author_item_photo img",
      (element) => element.src
    );
  } catch (error) {
    console.error("Author photo not found for:", articleUrl);
  }

  // Extract photo source
  let photoSource = "";
  try {
    photoSource = await page.$eval(".content_main_thumb_alt", (element) =>
      element.innerText.trim()
    );
  } catch (error) {
    console.error("Photo source not found for:", articleUrl);
  }

  // Extract article description
  let articleDescription = "";
  try {
    articleDescription = await page.$eval(".content_main_desc p", (element) =>
      element.innerText.trim()
    );
  } catch (error) {
    console.error("Article description not found for:", articleUrl);
  }

  // Extract article main text
  let mainText = "";
  try {
    mainText = await page.$eval(
      ".content_main_text",
      (element) => element.innerHTML
    );
  } catch (error) {
    console.error("Main text not found for:", articleUrl);
  }

  // Extract main text tags
  let mainTextTags = [];
  try {
    mainTextTags = await page.$$eval(
      ".content_main_text_tags span a",
      (elements) => elements.map((element) => element.innerText.trim())
    );
  } catch (error) {
    console.error("Main text tags not found for:", articleUrl);
  }

  return {
    date,
    authorName,
    authorPhoto,
    photoSource,
    articleDescription,
    mainText,
    mainTextTags,
  };
};

module.exports = scrapeTengrinews;
