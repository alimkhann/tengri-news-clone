const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const url = "https://tengrinews.kz/";

const scrapeTengrinews = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: "./dist/tmp",
    });

    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector(".main-news_super_item");

    const result = await page.evaluate(async (url) => {
      // Function to wait for element visibility
      const waitForVisible = async (selector) => {
        await new Promise((resolve) => {
          const interval = setInterval(async () => {
            const element = document.querySelector(selector);
            if (
              element &&
              window.getComputedStyle(element).display !== "none"
            ) {
              clearInterval(interval);
              resolve();
            }
          }, 20000);
        });
      };

      const gridNewsData = [];
      const gridNewsElements = document.querySelectorAll(
        ".main-news_super_item"
      );

      for (const element of gridNewsElements) {
        const titleElement = element.querySelector("span > a");
        const timeElement = element.querySelector(
          "div > span:nth-child(1) > time"
        );
        const imageElement = element.querySelector("picture source");

        if (titleElement && timeElement && imageElement) {
          const title = titleElement.innerText.trim();
          const time = timeElement.innerText.trim();
          const imageUrl =
            url + imageElement.getAttribute("srcset").split(" ")[0];

          // Wait for views and comments elements to be available
          await waitForVisible(
            ".main-news_super_item_meta > .content_item_meta_viewings > span[data-type='news']"
          );
          await waitForVisible(
            ".main-news_super_item_meta > .content_item_meta_comments > span[data-type='news']"
          );

          const viewsElement = element.querySelector(
            ".main-news_super_item_meta > .content_item_meta_viewings > span[data-type='news']"
          );
          const commentsElement = element.querySelector(
            ".main-news_super_item_meta > .content_item_meta_comments > span[data-type='news']"
          );

          const views = viewsElement ? viewsElement.innerText.trim() : "N/A";
          const comments = commentsElement
            ? commentsElement.innerText.trim()
            : "N/A";

          gridNewsData.push({ title, time, views, comments, imageUrl });
        }
      }

      const scrollNewsData = [];
      const scrollNewsElements = document.querySelectorAll("div.tab");

      for (const element of scrollNewsElements) {
        const titleElement = element.querySelector(
          "#content-1 > div:nth-child(1) > span > a"
        );
        const timeElement = element.querySelector(
          "#content-1 > div:nth-child(1) > div > span:nth-child(1) > time"
        );

        if (titleElement && timeElement) {
          const title = titleElement.innerText.trim();
          const time = timeElement.innerText.trim();

          // Wait for views and comments elements to be visible
          await waitForVisible(
            ".main-news_top_item_meta .content_item_meta_viewings span"
          );
          await waitForVisible(
            ".main-news_top_item_meta .content_item_meta_comments span"
          );

          const viewsElement = element.querySelector(
            ".main-news_top_item_meta .content_item_meta_viewings span"
          );
          const commentsElement = element.querySelector(
            ".main-news_top_item_meta .content_item_meta_comments span"
          );

          const views = viewsElement ? viewsElement.innerText.trim() : "N/A";
          const comments = commentsElement
            ? commentsElement.innerText.trim()
            : "N/A";

          scrollNewsData.push({ title, time, views, comments });
        }
      }

      return { gridNewsData, scrollNewsData };
    }, url);

    for (const item of result.gridNewsData) {
      const imageUrl = url + item.imageUrl;
      const imageName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
      const imagePath = path.join("./images/scraped-images", imageName);

      try {
        const viewSource = await page.goto(imageUrl);
        fs.writeFileSync(imagePath, await viewSource.buffer());
        console.log(`Image downloaded: ${imagePath}`);
      } catch (error) {
        console.error(`Error downloading image: ${imageUrl}`, error);
      }
    }

    await browser.close();

    // Convert the data to CSV string
    const csvData = result.gridNewsData.map(
      ({ title, time, views, comments, imageUrl }) =>
        `"${title}","${time}","${views}","${comments}","${imageUrl}"`
    );
    const csvString = csvData.join("\n");

    // Write the CSV string to a file
    const filePathCSV = path.join("./dist/", "scraped_data.csv");
    fs.writeFileSync(filePathCSV, csvString);
    console.log(`Data exported to CSV file: ${filePathCSV}`);

    // Write the data to a JSON file
    const filePathJSON = path.join("./dist/", "scraped_data.json");
    fs.writeFileSync(
      filePathJSON,
      JSON.stringify(result.gridNewsData, null, 2)
    );
    console.log(`Data exported to JSON file: ${filePathJSON}`);

    return result;
  } catch (error) {
    console.error("Error during scraping:", error);
    return [];
  }
};

scrapeTengrinews()
  .then((value) => {
    console.log(value);
  })
  .catch((error) => {
    console.error("Error during scraping:", error);
  });
