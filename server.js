const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Lets the server read JSON sent from fetch()
app.use(express.json());

// Serves the service worker BEFORE express.static so these headers always apply.
// Cache-Control: no-cache forces the browser to revalidate the file on every load
// so it picks up new versions immediately instead of serving a stale cached copy.
// Service-Worker-Allowed: / explicitly grants the SW scope over the whole origin.
// This route must come before express.static, otherwise static middleware intercepts
// the request first and the headers below are never sent.
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(path.join(__dirname, "sw.js"));
});

// Serves your normal portfolio files: HTML, CSS, JS, images, JSON
app.use(express.static(__dirname));

// Simple server-side sanitizer
const sanitizeInput = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
};

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "portfolio_index.html"));
});

// Gets project data from JSON file
app.get("/api/projects", (req, res, next) => {
  fs.readFile(path.join(__dirname, "json", "projects.json"), "utf8", (error, data) => {
    if (error) {
      next(error);
      return;
    }

    try {
      const projects = JSON.parse(data);
      res.json(projects);
    } catch (parseError) {
      next(parseError);
    }
  });
});

// Handles a new project submission
app.post("/api/projects", (req, res) => {
  const title = sanitizeInput(req.body.title);
  const description = sanitizeInput(req.body.description);
  const technologiesUsed = sanitizeInput(req.body.technologiesUsed);
  const link = sanitizeInput(req.body.link || "");

  if (!title || !description || !technologiesUsed) {
    res.status(400).json({
      message: "Title, description, and technologies are required."
    });
    return;
  }

  const newProject = {
    title,
    description,
    technologiesUsed,
    image: "Images/Chargediscposter.png",
    video: null,
    link
  };

  res.status(201).json({
    message: "Project was checked and accepted by the server.",
    project: newProject
  });
});

// Stores push subscriptions in memory for the duration the server is running.
// In a real deployment you would persist these in a database.
const pushSubscriptions = [];

// Accepts a push subscription object from the client and stores it.
// The client sends this after calling PushManager.subscribe() in the browser.
app.post("/api/push/subscribe", (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ message: "A valid push subscription object is required." });
    return;
  }

  // Avoid saving duplicate subscriptions for the same endpoint.
  const alreadySaved = pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);

  if (!alreadySaved) {
    pushSubscriptions.push(subscription);
    console.log("Push subscription saved. Total subscribers:", pushSubscriptions.length);
  }

  res.status(201).json({ message: "Push subscription saved successfully." });
});

// Returns the current number of stored push subscriptions.
// Useful for verifying the subscribe endpoint works during testing.
app.get("/api/push/count", (req, res) => {
  res.json({ subscribers: pushSubscriptions.length });
});

// 404 route for bad links
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

// Main error handler
app.use((error, req, res, _next) => {
  console.error("Server error:", error.message);

  res.status(500).json({
    message: "Something went wrong on the server."
  });
});

app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});