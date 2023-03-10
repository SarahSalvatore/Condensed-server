// Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConfig.js");
const corsOptions = require("./config/cors/options.js");
const axios = require("axios").default;
const { customAlphabet } = require("nanoid");

// Set nanoid with hexidecimal system (16 characters) - 8 characters long
let nanoid = customAlphabet("0123456789abcdef", 8);

// Db connection
connectDB();

// Import URL model
const URL = require("./models/Urls");

// App initialization
app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Add Access Control Allow Origin headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://condensed.netlify.app");
  res.header("Access-Control-Allow-Headers");
  next();
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Condensed API",
  });
});

// Get all urls
app.get("/urls", async (req, res, next) => {
  try {
    let urls = await URL.find({}).lean().exec();
    if (urls.length) {
      return res.status(200).json(urls);
    } else {
      return res.status(404).json({ message: "No urls found." });
    }
  } catch (err) {
    next(err);
  }
});

app.post("/condense", async (req, res, next) => {
  let { url } = req.body;
  // if the url received ends with /, remove the slash to avoid duplicates with and without a slash
  if (url) {
    url.endsWith("/") ? (url = url.slice(0, url.length - 1)) : url;
    // If there is a url in the req.body, execute findOne, else return an error that a URL is required
    try {
      let existingUrl = await URL.findOne({ originalUrl: url }).lean().exec();
      // if a url already exists in db, send existing url, else create slug
      if (existingUrl) {
        return res.json({ newUrl: `${process.env.URL}/${existingUrl.slug}` });
      } else {
        let slug = nanoid();
        let existingSlug = await URL.findOne({ slug: slug }).lean().exec();
        // if the slug generated already exists, generate a new slug until it is unique
        while (existingSlug) {
          slug = nanoid();
          existingSlug = await URL.findOne({ slug: slug }).lean().exec();
        }
        // if the slug is unique and not in the db, create a new entry
        if (!existingSlug) {
          let createdUrl = await URL.create({
            originalUrl: url,
            slug: slug,
          });
          return res.json({
            newUrl: `${process.env.URL}/${createdUrl.slug}`,
          });
        }
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400);
    const error = new Error("A URL is required.");
    next(error);
  }
});

// If the slug (specified via params) exists in DB, redirect to the original URL. Else, function will go to next (which is the notFound function below.)
app.get("/:slug", async (req, res, next) => {
  try {
    let storedUrl = await URL.findOne({ slug: req.params.slug }).lean().exec();

    if (storedUrl) {
      res.status(301).redirect(storedUrl.originalUrl);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

// Not found and error creation
const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
};

// Error handler - error stack only displays in development environment and not production
const errorHandler = (err, req, res, next) => {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    error: {
      status: res.statusCode,
      stack: process.env.ENV === "development" ? err.stack : undefined,
    },
  });
};

// Setup error middleware
app.use(notFound);
app.use(errorHandler);

// listens for open/successful mongo connection and app listening on PORT
mongoose.connection.once("open", () => {
  console.log("Database is connected");
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});
