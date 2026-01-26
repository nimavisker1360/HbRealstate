import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

const clampRating = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 5;
  return Math.max(1, Math.min(5, Math.round(parsed)));
};

// Public: get all published testimonials
export const getAllTestimonials = asyncHandler(async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.status(200).send(testimonials);
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    res.status(500).send({ message: "Error fetching testimonials" });
  }
});

// Admin: get all testimonials
export const getAllTestimonialsAdmin = asyncHandler(async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.status(200).send({ totalTestimonials: testimonials.length, testimonials });
  } catch (err) {
    console.error("Error fetching testimonials (admin):", err);
    res.status(500).send({ message: "Error fetching testimonials" });
  }
});

// Admin: create testimonial
export const createTestimonial = asyncHandler(async (req, res) => {
  const { data } = req.body;

  if (!data?.name || !data?.comment) {
    return res
      .status(400)
      .send({ message: "Name and comment are required" });
  }

  try {
    const maxOrder = await prisma.testimonial.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const testimonial = await prisma.testimonial.create({
      data: {
        name: data.name,
        role: data.role || "",
        company: data.company || "",
        image: data.image || "",
        rating: clampRating(data.rating),
        comment: data.comment,
        staffBehavior: data.staffBehavior || "",
        published: data.published !== undefined ? data.published : true,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    res.status(201).send({ message: "Testimonial created", testimonial });
  } catch (err) {
    console.error("Error creating testimonial:", err);
    res.status(500).send({ message: "Error creating testimonial" });
  }
});

// Admin: update testimonial
export const updateTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        company: data.company,
        image: data.image,
        rating: clampRating(data.rating),
        comment: data.comment,
        staffBehavior: data.staffBehavior,
        published: data.published,
      },
    });

    res.status(200).send({ message: "Testimonial updated", testimonial });
  } catch (err) {
    console.error("Error updating testimonial:", err);
    res.status(500).send({ message: "Error updating testimonial" });
  }
});

// Admin: delete testimonial
export const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.testimonial.delete({ where: { id } });
    res.status(200).send({ message: "Testimonial deleted" });
  } catch (err) {
    console.error("Error deleting testimonial:", err);
    res.status(500).send({ message: "Error deleting testimonial" });
  }
});

// Admin: toggle publish status
export const toggleTestimonialPublish = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });

    if (!testimonial) {
      return res.status(404).send({ message: "Testimonial not found" });
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: { published: !testimonial.published },
    });

    res.status(200).send({ message: "Testimonial status updated", testimonial: updated });
  } catch (err) {
    console.error("Error toggling testimonial publish:", err);
    res.status(500).send({ message: "Error updating testimonial status" });
  }
});

// Admin: reorder testimonials
export const reorderTestimonials = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;

  try {
    const updatePromises = orderedIds.map((id, index) =>
      prisma.testimonial.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updatePromises);
    res.status(200).send({ message: "Testimonials reordered successfully" });
  } catch (err) {
    console.error("Error reordering testimonials:", err);
    res.status(500).send({ message: "Error reordering testimonials" });
  }
});
