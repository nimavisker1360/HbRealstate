import { loadBackendEnv } from "../config/loadEnv.js";
loadBackendEnv();

import { MongoClient } from "mongodb";
import { put } from "@vercel/blob";
import { resolveMongoDatabaseConfig } from "../config/databaseConfig.js";
import https from "node:https";
import http from "node:http";
import path from "node:path";

// ── Configuration ───────────────────────────────────────────────────
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
if (!BLOB_TOKEN) {
  console.error("❌ BLOB_READ_WRITE_TOKEN not found in .env");
  process.exit(1);
}

const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".ogg": "video/ogg",
};

const isCloudinaryUrl = (url) =>
  typeof url === "string" && url.includes("res.cloudinary.com");

// ── Helpers ─────────────────────────────────────────────────────────
const downloadToBuffer = (url) =>
  new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    proto.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });

const guessMime = (url) => {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase().slice(0, 10);
    return MIME_MAP[ext] || "application/octet-stream";
  } catch {
    return "application/octet-stream";
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── URL migration cache ─────────────────────────────────────────────
const urlCache = new Map();

const migrateUrl = async (url, label) => {
  if (!isCloudinaryUrl(url)) return url;
  if (urlCache.has(url)) {
    console.log(`   ♻️  [cache] ${label}`);
    return urlCache.get(url);
  }

  try {
    console.log(`   ⬇️  Downloading ${label}...`);
    const buffer = await downloadToBuffer(url);

    const contentType = guessMime(url);
    const ext = path.extname(new URL(url).pathname).slice(0, 10) || ".bin";
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const pathname = `migration/${safeName}`;

    console.log(`   ⬆️  Uploading to Vercel Blob (${(buffer.length / 1024).toFixed(1)} KB)...`);
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      token: BLOB_TOKEN,
    });

    console.log(`   ✅ Done → ${blob.url.substring(0, 80)}...`);
    urlCache.set(url, blob.url);
    return blob.url;
  } catch (err) {
    console.error(`   ❌ Failed ${label}: ${err.message}`);
    return url;
  } finally {
    await sleep(150);
  }
};

const migrateUrlArray = async (urls, label) => {
  if (!Array.isArray(urls)) return urls;
  const migrated = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    if (typeof u === "string" && isCloudinaryUrl(u)) {
      migrated.push(await migrateUrl(u, `${label}[${i}]`));
    } else {
      migrated.push(u);
    }
  }
  return migrated;
};

// ── Main ────────────────────────────────────────────────────────────
const run = async () => {
  console.log("\n🚀 Cloudinary → Vercel Blob Migration");
  console.log("══════════════════════════════════════════\n");

  const dbConfig = await resolveMongoDatabaseConfig();
  const client = new MongoClient(dbConfig.url);
  await client.connect();
  const db = client.db(dbConfig.databaseName);
  console.log(`🗄️  Connected to database: ${dbConfig.databaseName}\n`);

  const collections = [
    {
      name: "Residency",
      fields: ["image", "images", "videos", "mapImage", "vaziyetPlani"],
    },
    { name: "Blog", fields: ["image", "video", "images"] },
    { name: "Testimonial", fields: ["image"] },
    { name: "Consultant", fields: ["image"] },
  ];

  let totalMigrated = 0;
  let totalUrls = 0;

  for (const col of collections) {
    const result = await migrateCollection(db, col.name, col.fields);
    totalMigrated += result.migrated;
    totalUrls += result.urls;
  }

  await client.close();
  console.log("\n══════════════════════════════════════════");
  console.log(`🎉 Migration complete! ${totalUrls} URLs migrated in ${totalMigrated} documents.`);
  console.log("══════════════════════════════════════════\n");
};

async function migrateCollection(db, collectionName, fields) {
  const collection = db.collection(collectionName);
  const docs = await collection.find({}).toArray();
  console.log(`\n📂 ${collectionName}: ${docs.length} documents`);
  console.log(`──────────────────────────────────────────`);

  let migratedCount = 0;
  let urlCount = 0;

  for (const doc of docs) {
    const docId = doc._id;
    const docLabel = doc.title || doc.projectName || doc.name || String(docId);
    let needsUpdate = false;
    const updateSet = {};

    for (const field of fields) {
      const value = doc[field];

      if (typeof value === "string" && isCloudinaryUrl(value)) {
        const newVal = await migrateUrl(value, `${collectionName}.${field} (${docLabel})`);
        if (newVal !== value) {
          updateSet[field] = newVal;
          needsUpdate = true;
          urlCount++;
        }
      } else if (Array.isArray(value)) {
        const hasOld = value.some((v) => typeof v === "string" && isCloudinaryUrl(v));
        if (hasOld) {
          const newArr = await migrateUrlArray(value, `${collectionName}.${field} (${docLabel})`);
          const changed = newArr.some((v, i) => v !== value[i]);
          if (changed) {
            updateSet[field] = newArr;
            needsUpdate = true;
            urlCount += newArr.filter((v, i) => v !== value[i]).length;
          }
        }
      }
    }

    // Handle nested dairePlanlari (floor plans)
    if (collectionName === "Residency" && Array.isArray(doc.dairePlanlari)) {
      let planChanged = false;
      const newPlans = [];
      for (const plan of doc.dairePlanlari) {
        const newPlan = { ...plan };
        if (typeof plan.image === "string" && isCloudinaryUrl(plan.image)) {
          newPlan.image = await migrateUrl(plan.image, `dairePlanlari.image (${docLabel})`);
          planChanged = true;
          urlCount++;
        }
        if (Array.isArray(plan.images)) {
          const hasOld = plan.images.some((v) => typeof v === "string" && isCloudinaryUrl(v));
          if (hasOld) {
            newPlan.images = await migrateUrlArray(plan.images, `dairePlanlari.images (${docLabel})`);
            planChanged = true;
            urlCount += newPlan.images.filter((v, i) => v !== plan.images[i]).length;
          }
        }
        newPlans.push(newPlan);
      }
      if (planChanged) {
        const actuallyChanged = JSON.stringify(newPlans) !== JSON.stringify(doc.dairePlanlari);
        if (actuallyChanged) {
          updateSet.dairePlanlari = newPlans;
          needsUpdate = true;
        }
      }
    }

    // Handle nested blog blocks
    if (collectionName === "Blog") {
      for (const blockField of ["blocks_en", "blocks_tr", "blocks_ru"]) {
        if (!Array.isArray(doc[blockField])) continue;
        let blockChanged = false;
        const newBlocks = [];
        for (const block of doc[blockField]) {
          const newBlock = { ...block };
          if (typeof block.image === "string" && isCloudinaryUrl(block.image)) {
            newBlock.image = await migrateUrl(block.image, `${blockField}.image (${docLabel})`);
            blockChanged = true;
            urlCount++;
          }
          if (typeof block.video === "string" && isCloudinaryUrl(block.video)) {
            newBlock.video = await migrateUrl(block.video, `${blockField}.video (${docLabel})`);
            blockChanged = true;
            urlCount++;
          }
          if (Array.isArray(block.lines)) {
            const newLines = [];
            let lineChanged = false;
            for (const line of block.lines) {
              const newLine = { ...line };
              if (typeof line.image === "string" && isCloudinaryUrl(line.image)) {
                newLine.image = await migrateUrl(line.image, `${blockField}.line.image (${docLabel})`);
                lineChanged = true;
                urlCount++;
              }
              if (typeof line.video === "string" && isCloudinaryUrl(line.video)) {
                newLine.video = await migrateUrl(line.video, `${blockField}.line.video (${docLabel})`);
                lineChanged = true;
                urlCount++;
              }
              newLines.push(newLine);
            }
            if (lineChanged) {
              newBlock.lines = newLines;
              blockChanged = true;
            }
          }
          newBlocks.push(newBlock);
        }
        if (blockChanged) {
          const actuallyChanged = JSON.stringify(newBlocks) !== JSON.stringify(doc[blockField]);
          if (actuallyChanged) {
            updateSet[blockField] = newBlocks;
            needsUpdate = true;
          }
        }
      }
    }

    if (needsUpdate) {
      await collection.updateOne({ _id: docId }, { $set: updateSet });
      migratedCount++;
      console.log(`   💾 Updated ${docLabel}`);
    }
  }

  console.log(`   📊 ${collectionName}: ${migratedCount}/${docs.length} documents migrated`);
  return { migrated: migratedCount, urls: urlCount };
}

// ── Run ─────────────────────────────────────────────────────────────
run().catch((err) => {
  console.error("💥 Migration failed:", err);
  process.exit(1);
});
