import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { userRoute } from "./routes/userRoute.js";
import { residencyRoute } from "./routes/residencyRoute.js";
import { consultantRoute } from "./routes/consultantRoute.js";
import { emailRoute } from "./routes/emailRoute.js";
import { blogRoute } from "./routes/blogRoute.js";
import { housingSalesRoute } from "./routes/housingSalesRoute.js";
import { testimonialRoute } from "./routes/testimonialRoute.js";
import { assistantRoute } from "./routes/assistantRoute.js";
import { marketRoute } from "./routes/marketRoute.js";
import { getSitemapXml } from "./controllers/sitemapCntrl.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Dynamic XML sitemap (served via Vercel rewrite from /sitemap.xml).
app.get("/sitemap.xml", getSitemapXml);
app.get("/api/sitemap.xml", getSitemapXml);

// Routes
app.use("/api/user", userRoute);
app.use("/api/residency", residencyRoute);
app.use("/api/consultant", consultantRoute);
app.use("/api/email", emailRoute);
app.use("/api/blog", blogRoute);
app.use("/api/housing-sales", housingSalesRoute);
app.use("/api/testimonial", testimonialRoute);
app.use("/api/assistant", assistantRoute);
app.use("/api/market", marketRoute);

export default app;
