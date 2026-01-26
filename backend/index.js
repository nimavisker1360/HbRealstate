import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { prisma } from "./config/prismaConfig.js";
import { userRoute } from "./routes/userRoute.js";
import { residencyRoute } from "./routes/residencyRoute.js";
import { consultantRoute } from "./routes/consultantRoute.js";
import { emailRoute } from "./routes/emailRoute.js";
import { blogRoute } from "./routes/blogRoute.js";
import { housingSalesRoute } from "./routes/housingSalesRoute.js";
import { testimonialRoute } from "./routes/testimonialRoute.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Routes
app.use("/api/user", userRoute);
app.use("/api/residency", residencyRoute);
app.use("/api/consultant", consultantRoute);
app.use("/api/email", emailRoute);
app.use("/api/blog", blogRoute);
app.use("/api/housing-sales", housingSalesRoute);
app.use("/api/testimonial", testimonialRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Email API available at /api/email`);
});
