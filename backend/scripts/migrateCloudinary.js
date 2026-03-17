import { loadBackendEnv } from "../config/loadEnv.js";
loadBackendEnv();

import { v2 as cloudinary } from "cloudinary";
import { MongoClient } from "mongodb";
import { resolveMongoDatabaseConfig } from "../config/databaseConfig.js";
import https from "node:https";
import http from "node:http";
import { pipeline } from "node:stream/promises";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// ── Configuration ───────────────────────────────────────────────────
const OLD_CLOUD = "ducct0j1f";
const NEW_CLOUD = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dxxxhbnoo";

const CLOUDINARY_URL = process.env.CLOUDINARY_URL || "";
const cloudinaryMatch = CLOUDINARY_URL.match(
  /cloudinary:\/\/(\d+):([^@]+)@(.+)/
);
if (!cloudinaryMatch) {
  console.error("❌ CLOUDINARY_URL not found or invalid in .env");
  process.exit(1);
}

const [, apiKey, apiSecret, cloudName] = cloudinaryMatch;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

console.log(`☁️  Target Cloudinary cloud: ${cloudName}`);
console.log(`📦 Migrating URLs from: ${OLD_CLOUD} → ${cloudName}`);

// ── Helpers ─────────────────────────────────────────────────────────
const TEMP_DIR = path.join(os.tmpdir(), "cloudinary_migration");

const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
};

const cleanTempDir = () => {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
};

const isOldCloudUrl = (url) =>
  typeof url === "string" &&
  url.includes("res.cloudinary.com") &&
  url.includes(`/${OLD_CLOUD}/`);

const detectResourceType = (url) => {
  if (url.includes("/video/upload/")) return "video";
  if (url.includes("/image/upload/")) return "image";
  if (url.includes("/raw/upload/")) return "raw";
  return "auto";
};

const downloadFile = (url, destPath) =>
  new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    proto.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(
          new Error(`HTTP ${res.statusCode} for ${url}`)
        );
      }
      const ws = fs.createWriteStream(destPath);
      pipeline(res, ws).then(resolve).catch(reject);
    }).on("error", reject);
  });

const uploadToNewCloud = async (localPath, resourceType) => {
  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: resourceType,
    timeout: 120000,
  });
  return result.secure_url;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── URL migration cache (avoid re-uploading the same resource) ──────
const urlCache = new Map();

const migrateUrl = async (url, label) => {
  if (!isOldCloudUrl(url)) return url;

  if (urlCache.has(url)) {
    console.log(`   ♻️  [cache] ${label}`);
    return urlCache.get(url);
  }

  const resourceType = detectResourceType(url);
  const ext =
    path.extname(new URL(url).pathname).slice(0, 10) || ".bin";
  const tmpFile = path.join(
    TEMP_DIR,
    `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
  );

  try {
    console.log(`   ⬇️  Downloading (${resourceType}) ${label}...`);
    await downloadFile(url, tmpFile);

    console.log(`   ⬆️  Uploading to ${cloudName}...`);
    const newUrl = await uploadToNewCloud(tmpFile, resourceType);
    console.log(`   ✅ Done → ${newUrl.substring(0, 80)}...`);

    urlCache.set(url, newUrl);
    return newUrl;
  } catch (err) {
    console.error(`   ❌ Failed ${label}: ${err.message}`);
    return url; // keep original on failure
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await sleep(200);
  }
};

const migrateUrlArray = async (urls, label) => {
  if (!Array.isArray(urls)) return urls;
  const migrated = [];
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    if (typeof u === "string" && isOldCloudUrl(u)) {
      migrated.push(await migrateUrl(u, `${label}[${i}]`));
    } else {
      migrated.push(u);
    }
  }
  return migrated;
};

// ── Pre-flight check ────────────────────────────────────────────────
const checkOldCloudAccess = async () => {
  const testUrl = `https://res.cloudinary.com/${OLD_CLOUD}/image/upload/sample.jpg`;
  return new Promise((resolve) => {
    https.get(testUrl, { timeout: 10000 }, (res) => {
      res.resume();
      if (res.statusCode === 401) {
        const cldError = res.headers["x-cld-error"] || "";
        if (cldError.includes("disabled")) {
          resolve({ ok: false, reason: `Cloud "${OLD_CLOUD}" is DISABLED` });
          return;
        }
      }
      resolve({ ok: true });
    }).on("error", (err) => {
      resolve({ ok: false, reason: err.message });
    });
  });
};

// ── Main ────────────────────────────────────────────────────────────
const run = async () => {
  console.log("\n🔍 Checking old cloud accessibility...");
  const access = await checkOldCloudAccess();
  if (!access.ok) {
    console.error(`\n⛔ Cannot proceed: ${access.reason}`);
    console.error(
      `   Please re-enable the Cloudinary cloud "${OLD_CLOUD}" first.`
    );
    console.error(
      `   Go to https://console.cloudinary.com → Settings → Account → Re-enable.\n`
    );
    process.exit(1);
  }
  console.log("✅ Old cloud is accessible!\n");

  ensureTempDir();

  const dbConfig = await resolveMongoDatabaseConfig();
  const client = new MongoClient(dbConfig.url);
  await client.connect();
  const db = client.db(dbConfig.databaseName);
  console.log(`🗄️  Connected to database: ${dbConfig.databaseName}`);

  const collections = [
    { name: "Residency", fields: await getResidencyFields() },
    { name: "Blog", fields: ["image", "video", "images"] },
    { name: "Testimonial", fields: ["image"] },
    { name: "Consultant", fields: ["image"] },
  ];

  for (const col of collections) {
    await migrateCollection(db, col.name, col.fields);
  }

  cleanTempDir();
  await client.close();
  console.log("\n🎉 Migration complete!");
};

async function getResidencyFields() {
  return [
    "image",
    "images",
    "videos",
    "mapImage",
    "vaziyetPlani",
  ];
}

async function migrateCollection(db, collectionName, fields) {
  const collection = db.collection(collectionName);
  const docs = await collection.find({}).toArray();
  console.log(
    `\n══════════════════════════════════════════`
  );
  console.log(
    `📂 ${collectionName}: ${docs.length} documents`
  );
  console.log(
    `══════════════════════════════════════════`
  );

  let migratedCount = 0;

  for (const doc of docs) {
    const docId = doc._id;
    const docLabel =
      doc.title || doc.projectName || doc.name || String(docId);
    let needsUpdate = false;
    const updateSet = {};

    for (const field of fields) {
      const value = doc[field];

      if (typeof value === "string" && isOldCloudUrl(value)) {
        const newVal = await migrateUrl(
          value,
          `${collectionName}.${field} (${docLabel})`
        );
        if (newVal !== value) {
          updateSet[field] = newVal;
          needsUpdate = true;
        }
      } else if (Array.isArray(value)) {
        const hasOld = value.some(
          (v) => typeof v === "string" && isOldCloudUrl(v)
        );
        if (hasOld) {
          const newArr = await migrateUrlArray(
            value,
            `${collectionName}.${field} (${docLabel})`
          );
          const changed = newArr.some((v, i) => v !== value[i]);
          if (changed) {
            updateSet[field] = newArr;
            needsUpdate = true;
          }
        }
      }
    }

    // Handle nested dairePlanlari (floor plans with images)
    if (
      collectionName === "Residency" &&
      Array.isArray(doc.dairePlanlari)
    ) {
      let planChanged = false;
      const newPlans = [];
      for (const plan of doc.dairePlanlari) {
        const newPlan = { ...plan };
        if (typeof plan.image === "string" && isOldCloudUrl(plan.image)) {
          newPlan.image = await migrateUrl(
            plan.image,
            `dairePlanlari.image (${docLabel})`
          );
          planChanged = true;
        }
        if (Array.isArray(plan.images)) {
          const hasOld = plan.images.some(
            (v) => typeof v === "string" && isOldCloudUrl(v)
          );
          if (hasOld) {
            newPlan.images = await migrateUrlArray(
              plan.images,
              `dairePlanlari.images (${docLabel})`
            );
            planChanged = true;
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

    // Handle nested blog blocks (content blocks with images/videos)
    if (collectionName === "Blog") {
      for (const blockField of [
        "blocks_en",
        "blocks_tr",
        "blocks_ru",
      ]) {
        if (!Array.isArray(doc[blockField])) continue;
        let blockChanged = false;
        const newBlocks = [];
        for (const block of doc[blockField]) {
          const newBlock = { ...block };
          if (
            typeof block.image === "string" &&
            isOldCloudUrl(block.image)
          ) {
            newBlock.image = await migrateUrl(
              block.image,
              `${blockField}.image (${docLabel})`
            );
            blockChanged = true;
          }
          if (
            typeof block.video === "string" &&
            isOldCloudUrl(block.video)
          ) {
            newBlock.video = await migrateUrl(
              block.video,
              `${blockField}.video (${docLabel})`
            );
            blockChanged = true;
          }
          if (Array.isArray(block.lines)) {
            const newLines = [];
            let lineChanged = false;
            for (const line of block.lines) {
              const newLine = { ...line };
              if (
                typeof line.image === "string" &&
                isOldCloudUrl(line.image)
              ) {
                newLine.image = await migrateUrl(
                  line.image,
                  `${blockField}.line.image (${docLabel})`
                );
                lineChanged = true;
              }
              if (
                typeof line.video === "string" &&
                isOldCloudUrl(line.video)
              ) {
                newLine.video = await migrateUrl(
                  line.video,
                  `${blockField}.line.video (${docLabel})`
                );
                lineChanged = true;
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
      await collection.updateOne(
        { _id: docId },
        { $set: updateSet }
      );
      migratedCount++;
      console.log(`   💾 Updated ${docLabel}`);
    }
  }

  console.log(
    `\n   📊 ${collectionName}: ${migratedCount}/${docs.length} documents migrated`
  );
}

// ── Run ─────────────────────────────────────────────────────────────
run().catch((err) => {
  console.error("💥 Migration failed:", err);
  cleanTempDir();
  process.exit(1);
});
