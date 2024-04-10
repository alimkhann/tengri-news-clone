const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const url = "https://tengrinews.kz/";
const limit = 20; // Limit for the number of scroll articles to scrape

const scrapeTengrinews = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: "./dist/tmp",
  });
  const page = await browser.newPage();

  // Set up browser environment for faster page load
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

  // Navigate to the website
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Scrape grid view news articles
  const gridArticles = await page.evaluate((url) => {
    const articles = [];
    document.querySelectorAll(".main-news_super_item").forEach(async (item) => {
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

      const viewsElement = item.querySelector(".content_item_meta_viewings");
      const views = viewsElement ? viewsElement.innerText.trim() : "";

      const commentsElement = item.querySelector(".content_item_meta_comments");
      const comments = commentsElement ? commentsElement.innerText.trim() : "";

      articles.push({ title, articleUrl, time, imageUrl, views, comments });
    });
    return articles;
  }, url);

  // Scrape scroll view news articles
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

  // Combine both sets of articles
  const allArticles = {
    gridView: gridArticles,
    scrollView: scrollArticles,
  };

  // Write data to a JSON file
  fs.writeFileSync(
    "./dist/articles_data.json",
    JSON.stringify(allArticles, null, 2)
  );

  // Download images
  const imageDir = "./images/scraped-images";
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
  }

  const downloadImage = async (url, filename) => {
    const viewSource = await page.goto(url);
    fs.writeFileSync(path.join(imageDir, filename), await viewSource.buffer());
  };

  for (const article of allArticles.gridView) {
    if (article.imageUrl) {
      const imageName = article.imageUrl.split("/").pop();
      await downloadImage(article.imageUrl, imageName);
    }
  }

  await browser.close();
};

scrapeTengrinews().catch((error) => {
  console.error("Error during scraping:", error);
});

module.exports = scrapeTengrinews;
