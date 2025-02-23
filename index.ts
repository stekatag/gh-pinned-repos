import express from "express";
import type { Request, Response } from "express";
import { parse, HTMLElement } from "node-html-parser";
import axios from "axios";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 3001;

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In production, look for files in the same directory as the compiled index.js
const publicPath =
  process.env.NODE_ENV === "production"
    ? path.join(dirname(__filename), "..", "public")
    : path.join(dirname(__filename), "public");

// Debug path resolution
console.log({
  NODE_ENV: process.env.NODE_ENV,
  __dirname,
  publicPath,
  exists: fs.existsSync(publicPath),
  files: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : [],
});

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5000,
  message: "Too many requests, please try again later.",
});

app.use(limiter);

const cache = new NodeCache({ stdTTL: 3600 });

type RepositoryData = {
  owner: string;
  repo: string;
  link: string;
  description: string;
  image: string;
  website: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
};

async function parseRepository(
  root: HTMLElement,
  el: HTMLElement
): Promise<RepositoryData> {
  const repoAnchor = el.querySelector("a");
  if (!repoAnchor) {
    throw new Error("Invalid repository data: missing repository link");
  }

  const repoPath = repoAnchor.getAttribute("href")?.split("/");
  if (!repoPath || repoPath.length < 2) {
    throw new Error("Invalid repository path");
  }

  const [, owner, repo] = repoPath;
  if (!owner || !repo) {
    throw new Error("Invalid repository owner or name");
  }

  const link = `https://github.com/${owner}/${repo}`;
  const image = `https://opengraph.githubassets.com/1/${owner}/${repo}`;

  let website = "";
  try {
    const repoResponse = await axios.get(link);
    const repoRoot = parse(repoResponse.data);
    website =
      repoRoot
        .querySelector('.BorderGrid-cell a[href^="http"]')
        ?.getAttribute("href") || "";
  } catch (error) {
    console.error("Error fetching repository details:", error);
  }

  const languageColorEl = el.querySelector(".repo-language-color");
  const languageColor =
    languageColorEl
      ?.getAttribute("style")
      ?.match(/background-color: ([^;]+)/)?.[1] || "";

  const parseMetric = (index: number): number => {
    const metricElement = el.querySelectorAll("a.pinned-item-meta")[index];
    if (!metricElement) return 0;

    const metricText = metricElement.text?.replace(/\n/g, "").trim();
    return Number(metricText) || 0;
  };

  return {
    owner,
    repo,
    link,
    description:
      el.querySelector("p.pinned-item-desc")?.text?.replace(/\n/g, "").trim() ||
      "",
    image,
    website,
    language:
      el.querySelector("span[itemprop='programmingLanguage']")?.text || "",
    languageColor,
    stars: parseMetric(0),
    forks: parseMetric(1),
  };
}

// Serve static files with proper error handling
app.use(
  express.static(publicPath, {
    fallthrough: true, // Allow falling through to next middleware if file not found
  })
);

// HTML route with error handling
app.get("/", (req: Request, res: Response) => {
  const indexPath = path.join(publicPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("Error loading page");
    }
  });
});

app.get("/api/repos", async (req: Request, res: Response): Promise<void> => {
  const username = req.query.username as string;
  const refresh = req.query.refresh === "true";

  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  try {
    const cacheKey = `user_${username}`;
    if (!refresh && cache.has(cacheKey)) {
      res.json(cache.get(cacheKey));
      return;
    }

    const response = await axios.get(`https://github.com/${username}`);
    const root = parse(response.data);
    const pinnedItems = root.querySelectorAll(".js-pinned-item-list-item");

    if (!pinnedItems.length) {
      res.status(404).json({ error: "No pinned repositories found" });
      return;
    }

    const pinnedRepos = await Promise.all(
      pinnedItems.map((el) => parseRepository(root, el))
    );

    cache.set(cacheKey, pinnedRepos);
    res.json(pinnedRepos);
  } catch (error: any) {
    console.error("Error:", error.message);

    if (error.response?.status === 404) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (error.response?.status === 429) {
      res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
      return;
    }

    res.status(500).json({ error: error.message || "An error occurred" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
