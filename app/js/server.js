const express = require("express");
const scrapeTengrinews = require("./scrape"); // Import your scraping function
const app = express();
const port = 3000;

// Define a route for triggering the scraping process
app.get("/", async (req, res) => {
  try {
    await scrapeTengrinews(); // Call your scraping function
    res.send("Scraping completed successfully.");
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).send("Error during scraping.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
