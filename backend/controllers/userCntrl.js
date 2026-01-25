import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

export const createUser = asyncHandler(async (req, res) => {
  console.log("========================================");
  console.log("📝 Creating User...");
  console.log("Received data:", req.body);

  let { email } = req.body;

  const userExists = await prisma.user.findUnique({ where: { email: email } });
  if (!userExists) {
    console.log("✅ User does not exist. Creating new user...");
    const user = await prisma.user.create({ data: req.body });
    console.log("✅ User created successfully:", user);

    res.send({
      message: "User registered successfully",
      user: user,
    });
  } else {
    console.log("ℹ️ User already exists in database");
    res.status(201).send({
      message: "User already registered",
    });
  }
});
//book visit

export const bookVisit = asyncHandler(async (req, res) => {
  const { email, date } = req.body;
  const { id } = req.params;

  try {
    const alreadyBooked = await prisma.user.findUnique({
      where: { email },
      select: { bookedVisits: true },
    });

    if (alreadyBooked.bookedVisits.some((visit) => visit.id === id)) {
      return res.status(400).json({
        message: "This residency visit is already booked",
      });
    }

    await prisma.user.update({
      where: { email: email },
      data: {
        bookedVisits: { push: { id, date } },
      },
    });

    res.send("Visit booked successfully");
  } catch (err) {
    throw new Error(err.message);
  }
});
//all bookings

export const allBookings = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const bookings = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        bookedVisits: true,
      },
    });

    res.status(200).send(bookings);
  } catch (err) {
    throw new Error(err.message);
  }
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { bookedVisits: true },
    });
    const index = user.bookedVisits.findIndex((visit) => visit.id === id);
    if (index === -1) {
      return res.status(400).json({
        message: "Booking not found",
      });
    } else {
      user.bookedVisits.splice(index, 1);
      await prisma.user.update({
        where: { email },
        data: { bookedVisits: user.bookedVisits },
      });
      res.send("Booking cancelled successfully");
    }
  } catch (err) {
    throw new Error(err.message);
  }
});

// to add fav residencies

export const toFav = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { rid } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (user.favResidenciesID.includes(rid)) {
      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: {
          favResidenciesID: {
            set: user.favResidenciesID.filter((id) => id !== rid),
          },
        },
      });
      res.send({
        message: "Residency removed from favorites successfully",
        user: updatedUser,
      });
    } else {
      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: {
          favResidenciesID: { push: rid },
        },
      });
      res.send({
        message: "Residency added to favorites successfully",
        user: updatedUser,
      });
    }
  } catch (err) {
    throw new Error(err);
  }
});
// to get all fav list
export const getAllFav = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const favResd = await prisma.user.findUnique({
      where: { email: email },
      select: { favResidenciesID: true },
    });
    res.status(200).send(favResd);
  } catch (err) {
    throw new Error(err.message);
  }
});

// check if user is admin
export const checkAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { isAdmin: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ isAdmin: false, message: "User not found" });
    }

    res.status(200).json({ isAdmin: user.isAdmin || false });
  } catch (err) {
    throw new Error(err.message);
  }
});

// set user as admin (for initial setup)
export const setAdmin = asyncHandler(async (req, res) => {
  const { email, adminSecret } = req.body;

  // Simple secret check - in production, use a more secure method
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { isAdmin: true },
    });

    res.status(200).json({ message: "User is now admin", user });
  } catch (err) {
    throw new Error(err.message);
  }
});

// Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        address: true,
        profileComplete: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    throw new Error(err.message);
  }
});

// Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { email, name, image, phone, address } = req.body;

  try {
    // Check if profile is complete (has name, image, phone, and address)
    const profileComplete = !!(name && image && phone && address);

    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        name,
        image,
        phone,
        address,
        profileComplete,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileComplete: updatedUser.profileComplete,
      },
    });
  } catch (err) {
    throw new Error(err.message);
  }
});

// Get all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        address: true,
        profileComplete: true,
        isAdmin: true,
        bookedVisits: true,
        favResidenciesID: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      totalUsers: users.length,
      users: users,
    });
  } catch (err) {
    throw new Error(err.message);
  }
});

// Get all bookings from all users (admin only)
export const getAllUsersBookings = asyncHandler(async (req, res) => {
  try {
    // Get all users with their bookings
    const users = await prisma.user.findMany({
      where: {
        bookedVisits: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bookedVisits: true,
      },
    });

    // Get all residency IDs from bookings
    const allBookingIds = users.flatMap((user) =>
      user.bookedVisits.map((booking) => booking.id)
    );

    // Get residency details for all bookings
    const residencies = await prisma.residency.findMany({
      where: {
        id: {
          in: allBookingIds,
        },
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        country: true,
        image: true,
        price: true,
      },
    });

    // Create a map for quick residency lookup
    const residencyMap = {};
    residencies.forEach((res) => {
      residencyMap[res.id] = res;
    });

    // Combine user bookings with residency details
    const allBookings = [];
    users.forEach((user) => {
      user.bookedVisits.forEach((booking) => {
        const residency = residencyMap[booking.id];
        allBookings.push({
          bookingId: `${user.id}-${booking.id}`,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          property: residency || {
            id: booking.id,
            title: "Property Not Found",
          },
          date: booking.date,
        });
      });
    });

    // Sort by date (newest first)
    allBookings.sort((a, b) => {
      const dateA = a.date.split("/").reverse().join("");
      const dateB = b.date.split("/").reverse().join("");
      return dateB.localeCompare(dateA);
    });

    res.status(200).json({
      totalBookings: allBookings.length,
      bookings: allBookings,
    });
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    throw new Error(err.message);
  }
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { email } = req.params;

  try {
    await prisma.user.delete({
      where: { email },
    });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    throw new Error(err.message);
  }
});
