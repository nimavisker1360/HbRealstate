import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import {
  buildUserCreateData,
  getAuthenticatedEmail,
  isConfiguredAdminEmail,
} from "../utils/authenticatedEmail.js";

export const requireAdminUser = asyncHandler(async (req, res, next) => {
  const email = getAuthenticatedEmail(req);
  if (!email) {
    return res.status(403).json({
      success: false,
      message: "Admin access requires an authenticated email claim.",
    });
  }

  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isAdmin: true,
    },
  });

  if ((!user || !user.isAdmin) && isConfiguredAdminEmail(email)) {
    user = await prisma.user.upsert({
      where: { email },
      update: { isAdmin: true },
      create: buildUserCreateData({ email, isAdmin: true }),
      select: {
        id: true,
        email: true,
        isAdmin: true,
      },
    });
  }

  if (!user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  req.adminUser = user;
  next();
});
