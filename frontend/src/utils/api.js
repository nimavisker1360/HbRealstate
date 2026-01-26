import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

// Store for the token refresh function (will be set from Layout)
let tokenRefreshCallback = null;
let lastToastTime = 0;

export const setTokenRefreshCallback = (callback) => {
  tokenRefreshCallback = callback;
};

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      if (tokenRefreshCallback) {
        try {
          const newToken = await tokenRefreshCallback();
          if (newToken) {
            // Update the authorization header and retry
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      // Show toast only once every 5 seconds to avoid spam
      const now = Date.now();
      if (now - lastToastTime > 5000) {
        lastToastTime = now;
        toast.error("Session expired. Please login again.", {
          position: "bottom-right",
        });
      }
    }

    return Promise.reject(error);
  }
);

export const getAllProperties = async () => {
  try {
    const response = await api.get("/residency/allresd", {
      timeout: 10 * 1000,
    });
    if (response.status === 400 || response.status === 500) {
      throw response.data;
    }
    return response.data;
  } catch (error) {
    toast.error("Something's not right");
    throw error;
  }
};

export const getProperty = async (id) => {
  try {
    const response = await api.get(`/residency/${id}`, {
      timeout: 10 * 1000,
    });
    if (response.status === 400 || response.status === 500) {
      throw response.data;
    }
    return response.data;
  } catch (error) {
    toast.error("Something's not right");
    throw error;
  }
};

export const createUser = async (userData, token) => {
  try {
    console.log("📤 Sending registration request to API for:", userData.email);
    const response = await api.post(`/user/register`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("📥 Registration API response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Registration API error:",
      error.response?.data || error.message
    );
    toast.error("Something's not right, Please Try again");
    throw error;
  }
};

export const bookVisit = async (date, propertyId, email, token) => {
  try {
    await api.post(
      `/user/bookVisit/${propertyId}`,
      {
        email,
        id: propertyId,
        date: dayjs(date).format("DD/MM/YYYY"),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    toast.error("Something's not right. Please try again.");
    throw error;
  }
};

export const removeBooking = async (id, email, token) => {
  try {
    await api.post(
      `/user/removeBooking/${id}`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    toast.error("Something's not right. Please try again.");

    throw error;
  }
};

export const toFav = async (id, email, token) => {
  await api.post(
    `/user/toFav/${id}`,
    {
      email,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getAllFav = async (email, token) => {
  if (!token) return;
  try {
    const res = await api.post(
      `/user/allFav`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log(res)
    return res.data["favResidenciesID"];
  } catch (e) {
    toast.error("Something went wrong while fetching favs");
    throw e;
  }
};

export const getAllBookings = async (email, token) => {
  if (!token) return;
  try {
    const res = await api.post(
      `/user/allBookings`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log("res", res)
    return res.data["bookedVisits"];
  } catch (e) {
    toast.error("Something went wrong while fetching bookings");
    throw e;
  }
};

export const createResidency = async (data, token, userEmail) => {
  // Ensure userEmail is included in the data object
  const requestData = { ...data, userEmail };
  console.log("Sending residency data:", requestData);

  const response = await api.post(
    `/residency/create`,
    { data: requestData }, // Wrap in data object as backend expects req.body.data
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const checkAdmin = async (email, token) => {
  if (!token || !email) return { isAdmin: false };
  try {
    const res = await api.post(
      `/user/checkAdmin`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (e) {
    console.error("Error checking admin status:", e);
    return { isAdmin: false };
  }
};

// Get all bookings for admin panel
export const getAdminAllBookings = async (token) => {
  if (!token) return { totalBookings: 0, bookings: [] };
  try {
    const res = await api.get(`/user/admin/allBookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e) {
    console.error("Error fetching all bookings:", e);
    return { totalBookings: 0, bookings: [] };
  }
};

// Update residency (admin)
export const updateResidency = async (id, data, token) => {
  try {
    const response = await api.put(
      `/residency/update/${id}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating residency:", error);
    toast.error("Mülk güncellenirken bir hata oluştu");
    throw error;
  }
};

// Delete residency (admin)
export const deleteResidency = async (id, token) => {
  try {
    const response = await api.delete(`/residency/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting residency:", error);
    toast.error("Mülk silinirken bir hata oluştu");
    throw error;
  }
};

// ============ CONSULTANT API FUNCTIONS ============

// Get all consultants
export const getAllConsultants = async () => {
  try {
    const response = await api.get("/consultant/all", {
      timeout: 10 * 1000,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching consultants:", error);
    toast.error("Danışmanlar yüklenirken bir hata oluştu");
    throw error;
  }
};

// Get single consultant
export const getConsultant = async (id) => {
  try {
    const response = await api.get(`/consultant/${id}`, {
      timeout: 10 * 1000,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching consultant:", error);
    throw error;
  }
};

// Create consultant (admin)
export const createConsultant = async (data, token) => {
  try {
    const response = await api.post(
      `/consultant/create`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating consultant:", error);
    toast.error("Danışman eklenirken bir hata oluştu");
    throw error;
  }
};

// Update consultant (admin)
export const updateConsultant = async (id, data, token) => {
  try {
    const response = await api.put(
      `/consultant/update/${id}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating consultant:", error);
    toast.error("Danışman güncellenirken bir hata oluştu");
    throw error;
  }
};

// Delete consultant (admin)
export const deleteConsultant = async (id, token) => {
  try {
    const response = await api.delete(`/consultant/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting consultant:", error);
    toast.error("Danışman silinirken bir hata oluştu");
    throw error;
  }
};

// Toggle consultant availability (admin)
export const toggleConsultantAvailability = async (id, token) => {
  try {
    const response = await api.patch(
      `/consultant/toggle/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling consultant availability:", error);
    toast.error("Danışman durumu değiştirilirken bir hata oluştu");
    throw error;
  }
};

// Reorder consultants (admin)
export const reorderConsultants = async (orderedIds, token) => {
  try {
    const response = await api.put(
      `/consultant/reorder`,
      { orderedIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error reordering consultants:", error);
    toast.error("Danışman sırası değiştirilirken bir hata oluştu");
    throw error;
  }
};

// ============ USER PROFILE API FUNCTIONS ============

// Get user profile
export const getUserProfile = async (email, token) => {
  if (!token || !email) return null;
  try {
    const response = await api.post(
      `/user/profile`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profileData, token) => {
  if (!token) throw new Error("No token provided");
  try {
    const response = await api.put(`/user/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    toast.error("Profil güncellenirken bir hata oluştu");
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (token) => {
  if (!token) return { totalUsers: 0, users: [] };
  try {
    const response = await api.get(`/user/admin/allUsers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return { totalUsers: 0, users: [] };
  }
};

// Send Email
export const sendEmail = async (emailData) => {
  try {
    const response = await api.post("/email/send", emailData);
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Get All Contact Messages
export const getAllContactMessages = async (token) => {
  try {
    const response = await api.get("/email/messages", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return { totalMessages: 0, messages: [] };
  }
};

// Delete Contact Message
export const deleteContactMessage = async (id, token) => {
  try {
    const response = await api.delete(`/email/messages/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting contact message:", error);
    throw error;
  }
};

// Mark Message as Read
export const markMessageAsRead = async (id, token) => {
  try {
    const response = await api.put(`/email/messages/${id}/read`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

// ============ BLOG API FUNCTIONS ============

// Get all blogs (public)
export const getAllBlogs = async () => {
  try {
    const response = await api.get("/blog/all", {
      timeout: 10 * 1000,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    toast.error("Error loading blogs");
    throw error;
  }
};

// Get single blog
export const getBlog = async (id) => {
  try {
    const response = await api.get(`/blog/${id}`, {
      timeout: 10 * 1000,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw error;
  }
};

// Get all blogs for admin (including unpublished)
export const getAllBlogsAdmin = async (token) => {
  try {
    const response = await api.get("/blog/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return { totalBlogs: 0, blogs: [] };
  }
};

// Create blog (admin)
export const createBlog = async (data, token) => {
  try {
    const response = await api.post(
      `/blog/create`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating blog:", error);
    toast.error("Error creating blog");
    throw error;
  }
};

// Update blog (admin)
export const updateBlog = async (id, data, token) => {
  try {
    const response = await api.put(
      `/blog/update/${id}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating blog:", error);
    toast.error("Error updating blog");
    throw error;
  }
};

// Delete blog (admin)
export const deleteBlog = async (id, token) => {
  try {
    const response = await api.delete(`/blog/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting blog:", error);
    toast.error("Error deleting blog");
    throw error;
  }
};

// Toggle blog publish status (admin)
export const toggleBlogPublish = async (id, token) => {
  try {
    const response = await api.patch(
      `/blog/toggle/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling blog status:", error);
    toast.error("Error updating blog status");
    throw error;
  }
};

// Reorder blogs (admin)
export const reorderBlogs = async (orderedIds, token) => {
  try {
    const response = await api.put(
      `/blog/reorder`,
      { orderedIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error reordering blogs:", error);
    toast.error("Error reordering blogs");
    throw error;
  }
};

// Generate AI blog (admin)
export const generateAIBlog = async (marketData, autoPublish, token) => {
  try {
    const response = await api.post(
      `/blog/generate-ai`,
      { marketData, autoPublish },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 120000, // 2 minutes for AI generation
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error generating AI blog:", error);
    toast.error(error.response?.data?.message || "Error generating AI blog");
    throw error;
  }
};

// Generate multiple AI blogs (admin)
export const generateMultipleAIBlogs = async (marketDataArray, autoPublish, token) => {
  try {
    const response = await api.post(
      `/blog/generate-ai-multiple`,
      { marketDataArray, autoPublish },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 300000, // 5 minutes for multiple generations
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error generating multiple AI blogs:", error);
    toast.error(error.response?.data?.message || "Error generating AI blogs");
    throw error;
  }
};

// ============ TESTIMONIAL API FUNCTIONS ============

// Get all testimonials (public)
export const getAllTestimonials = async () => {
  try {
    const response = await api.get("/testimonial/all", {
      timeout: 10 * 1000,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    toast.error("Error loading testimonials");
    throw error;
  }
};

// Get all testimonials for admin
export const getAllTestimonialsAdmin = async (token) => {
  try {
    const response = await api.get("/testimonial/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching testimonials (admin):", error);
    return { totalTestimonials: 0, testimonials: [] };
  }
};

// Create testimonial (admin)
export const createTestimonial = async (data, token) => {
  try {
    const response = await api.post(
      `/testimonial/create`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating testimonial:", error);
    toast.error("Error creating testimonial");
    throw error;
  }
};

// Submit testimonial (public)
export const submitTestimonial = async (data) => {
  try {
    const response = await api.post("/testimonial/submit", data);
    return response.data;
  } catch (error) {
    console.error("Error submitting testimonial:", error);
    throw error;
  }
};

// Update testimonial (admin)
export const updateTestimonial = async (id, data, token) => {
  try {
    const response = await api.put(
      `/testimonial/update/${id}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating testimonial:", error);
    toast.error("Error updating testimonial");
    throw error;
  }
};

// Delete testimonial (admin)
export const deleteTestimonial = async (id, token) => {
  try {
    const response = await api.delete(`/testimonial/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    toast.error("Error deleting testimonial");
    throw error;
  }
};

// Toggle testimonial publish (admin)
export const toggleTestimonialPublish = async (id, token) => {
  try {
    const response = await api.patch(
      `/testimonial/toggle/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling testimonial status:", error);
    toast.error("Error updating testimonial status");
    throw error;
  }
};

// Reorder testimonials (admin)
export const reorderTestimonials = async (orderedIds, token) => {
  try {
    const response = await api.put(
      `/testimonial/reorder`,
      { orderedIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error reordering testimonials:", error);
    toast.error("Error reordering testimonials");
    throw error;
  }
};

// ============ HOUSING SALES API FUNCTIONS ============

// Get housing sales summary (yearly totals)
export const getHousingSalesSummary = async (province, year) => {
  try {
    const params = {};
    if (province) params.province = province;
    if (year) params.year = year;
    
    const response = await api.get("/housing-sales/summary", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching housing sales summary:", error);
    throw error;
  }
};

// Get housing sales by province
export const getHousingSalesByProvince = async (year) => {
  try {
    const params = {};
    if (year) params.year = year;
    
    const response = await api.get("/housing-sales/by-province", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching housing sales by province:", error);
    throw error;
  }
};

// Get housing sales by district
export const getHousingSalesByDistrict = async (province, year) => {
  try {
    const params = { province };
    if (year) params.year = year;
    
    const response = await api.get("/housing-sales/by-district", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching housing sales by district:", error);
    throw error;
  }
};

// Get list of provinces
export const getHousingProvinces = async () => {
  try {
    const response = await api.get("/housing-sales/provinces");
    return response.data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    throw error;
  }
};

// Get list of years
export const getHousingYears = async () => {
  try {
    const response = await api.get("/housing-sales/years");
    return response.data;
  } catch (error) {
    console.error("Error fetching years:", error);
    throw error;
  }
};

// Get Turkey stats
export const getTurkeyStats = async (province, year) => {
  try {
    const params = {};
    if (province) params.province = province;
    if (year) params.year = year;
    
    const response = await api.get("/housing-sales/turkey-stats", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching Turkey stats:", error);
    throw error;
  }
};
