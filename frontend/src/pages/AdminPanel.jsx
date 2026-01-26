import { useState, useContext, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Stepper,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Divider,
  Button,
  Avatar,
  Table,
  Loader,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  MultiSelect,
} from "@mantine/core";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useNavigate } from "react-router-dom";
import AddLocation from "../components/AddLocation";
import UploadImage from "../components/UploadImage";
import BasicDetails from "../components/BasicDetails";
import Facilities from "../components/Facilities";
import ProjectDetails from "../components/ProjectDetails";
import EditPropertyModal from "../components/EditPropertyModal";
import useAdmin from "../hooks/useAdmin";
import useProperties from "../hooks/useProperties";
import useConsultants from "../hooks/useConsultants";
import UserDetailContext from "../context/UserDetailContext";
import {
  getAdminAllBookings,
  deleteResidency,
  createConsultant,
  updateConsultant,
  deleteConsultant,
  toggleConsultantAvailability,
  getAllContactMessages,
  deleteContactMessage,
  reorderConsultants,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogPublish,
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialPublish,
  generateAIBlog,
} from "../utils/api";
import { toast } from "react-toastify";
import {
  MdDashboard,
  MdAddHome,
  MdList,

 
  MdHome,
  MdRefresh,
  MdEdit,
  MdDelete,
  MdPeople,
  MdPersonAdd,
  MdPhone,
  MdEmail,
  MdOutlineCloudUpload,
  MdClose,
  MdMessage,
  MdDragIndicator,
  MdArticle,
  MdAdd,
  MdBlock,
  MdCheckCircle,
  MdRateReview,
} from "react-icons/md";
import { FaStar } from "react-icons/fa6";
import { useRef } from "react";

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Table Row Component
const SortableTableRow = ({ consultant, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: consultant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    backgroundColor: isDragging ? "#f0f0f0" : undefined,
  };

  return (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <MdDragIndicator size={20} className="text-gray-400" />
        </div>
      </Table.Td>
      {children}
    </Table.Tr>
  );
};

SortableTableRow.propTypes = {
  consultant: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

const AdminPanel = () => {
  const [active, setActive] = useState(0);
  const [activeTab, setActiveTab] = useState("bookings");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const {
    userDetails: { token },
  } = useContext(UserDetailContext);
  const navigate = useNavigate();

  // Bookings state (reserved for future use)
  // eslint-disable-next-line no-unused-vars
  const [bookings, setBookings] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [bookingsLoading, setBookingsLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [totalBookings, setTotalBookings] = useState(0);

  // Properties state
  const {
    data: properties,
    isLoading: propertiesLoading,
    refetch: refetchProperties,
  } = useProperties();
  const [propertyFilter, setPropertyFilter] = useState("all"); // all, sale, local-project, international-project
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Consultants state
  const {
    data: consultants,
    isLoading: consultantsLoading,
    refetch: refetchConsultants,
  } = useConsultants();
  const [consultantModalOpened, setConsultantModalOpened] = useState(false);
  const [editConsultantModalOpened, setEditConsultantModalOpened] =
    useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [deleteConsultantModalOpened, setDeleteConsultantModalOpened] =
    useState(false);
  const [consultantToDelete, setConsultantToDelete] = useState(null);
  const [consultantLoading, setConsultantLoading] = useState(false);

  // Ordered consultants state for drag-and-drop
  const [orderedConsultants, setOrderedConsultants] = useState([]);

  // Update ordered consultants when consultants data changes
  useEffect(() => {
    if (consultants && consultants.length > 0) {
      setOrderedConsultants(consultants);
    }
  }, [consultants]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Consultant IDs for sortable context
  const consultantIds = useMemo(
    () => orderedConsultants.map((c) => c.id),
    [orderedConsultants]
  );

  // Handle drag end for consultants reordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedConsultants((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Save the new order to backend
        const orderedIds = newItems.map((c) => c.id);
        reorderConsultants(orderedIds, token)
          .then(() => {
            toast.success("Danışman sırası güncellendi");
          })
          .catch((error) => {
            console.error("Error saving order:", error);
            // Revert on error
            setOrderedConsultants(items);
          });

        return newItems;
      });
    }
  };

  // Contact Messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);

  // Blogs state
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [blogModalOpened, setBlogModalOpened] = useState(false);
  const [editBlogModalOpened, setEditBlogModalOpened] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [deleteBlogModalOpened, setDeleteBlogModalOpened] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const [aiGenerateModalOpened, setAiGenerateModalOpened] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [totalTestimonials, setTotalTestimonials] = useState(0);
  const [testimonialModalOpened, setTestimonialModalOpened] = useState(false);
  const [editTestimonialModalOpened, setEditTestimonialModalOpened] =
    useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [deleteTestimonialModalOpened, setDeleteTestimonialModalOpened] =
    useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [testimonialLoading, setTestimonialLoading] = useState(false);

  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    role: "",
    company: "",
    comment_tr: "",
    comment_en: "",
    staffBehavior: "",
    rating: 5,
    image: "",
    published: true,
  });

  const [blogForm, setBlogForm] = useState({
    title: "",
    category: "",
    content: "",
    summary: "",
    image: "",
    images: [], // Multiple images for gallery
    published: true,
  });

  const [aiMarketData, setAiMarketData] = useState({
    city: "İstanbul",
    district: "",
    neighborhood: "",
    avgSalePrice: "",
    avgRentalPrice: "",
    monthlyChange: "",
    yearlyChange: "",
    demandLevel: "متوسط",
    autoPublish: false,
  });

  const [consultantForm, setConsultantForm] = useState({
    name: "",
    title: "",
    title_en: "",
    title_tr: "",
    specialty: "",
    specialty_en: "",
    specialty_tr: "",
    experience: "",
    languages: [],
    rating: 5.0,
    reviews: 0,
    phone: "",
    whatsapp: "",
    email: "",
    linkedin: "",
    image: "",
    bio: "",
    bio_en: "",
    bio_tr: "",
    available: true,
  });

  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Turkish", label: "Turkish" },
    { value: "Arabic", label: "Arabic" },
    { value: "German", label: "German" },
    { value: "French", label: "French" },
    { value: "Russian", label: "Russian" },
    { value: "Mandarin", label: "Mandarin" },
    { value: "Spanish", label: "Spanish" },
    { value: "Persian", label: "Persian" },
  ];

  // Cloudinary widget for consultant image upload
  const cloudinaryRef = useRef();
  const consultantWidgetRef = useRef();
  const [imageUploading, setImageUploading] = useState(false);
  const testimonialWidgetRef = useRef();
  const [testimonialImageUploading, setTestimonialImageUploading] =
    useState(false);

  // Helper function to build cropped Cloudinary URL
  const buildCroppedUrl = (info) => {
    const { secure_url, coordinates } = info;

    // If there are crop coordinates, apply them to the URL
    if (coordinates?.custom?.[0]) {
      const [x, y, width, height] = coordinates.custom[0];
      // Insert crop transformation into the URL
      const urlParts = secure_url.split("/upload/");
      if (urlParts.length === 2) {
        return `${urlParts[0]}/upload/c_crop,x_${Math.round(x)},y_${Math.round(
          y
        )},w_${Math.round(width)},h_${Math.round(height)}/${urlParts[1]}`;
      }
    }
    return secure_url;
  };

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    consultantWidgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset:
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        croppingCoordinatesMode: "custom",
        showSkipCropButton: false,
        resourceType: "image",
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "bmp",
          "tiff",
          "svg",
          "heic",
          "heif",
          "avif",
          "ico",
          "raw",
        ],
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          const croppedUrl = buildCroppedUrl(result.info);
          setConsultantForm((prev) => ({
            ...prev,
            image: croppedUrl,
          }));
          setImageUploading(false);
        }
        if (result.event === "close") {
          setImageUploading(false);
        }
      }
    );

    testimonialWidgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset:
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        croppingCoordinatesMode: "custom",
        showSkipCropButton: false,
        resourceType: "image",
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "bmp",
          "tiff",
          "svg",
          "heic",
          "heif",
          "avif",
          "ico",
          "raw",
        ],
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          const croppedUrl = buildCroppedUrl(result.info);
          setTestimonialForm((prev) => ({
            ...prev,
            image: croppedUrl,
          }));
          setTestimonialImageUploading(false);
        }
        if (result.event === "close") {
          setTestimonialImageUploading(false);
        }
      }
    );
  }, []);

  const openConsultantImageUpload = () => {
    setImageUploading(true);
    consultantWidgetRef.current?.open();
  };

  const removeConsultantImage = () => {
    setConsultantForm((prev) => ({ ...prev, image: "" }));
  };

  const openTestimonialImageUpload = () => {
    setTestimonialImageUploading(true);
    testimonialWidgetRef.current?.open();
  };

  const removeTestimonialImage = () => {
    setTestimonialForm((prev) => ({ ...prev, image: "" }));
  };

  // Cloudinary widget for blog image upload (main image)
  const blogWidgetRef = useRef();
  const [blogImageUploading, setBlogImageUploading] = useState(false);

  // Cloudinary widget for blog gallery images (multiple)
  const blogGalleryWidgetRef = useRef();
  const [blogGalleryUploading, setBlogGalleryUploading] = useState(false);

  useEffect(() => {
    blogWidgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset:
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        cropping: true,
        croppingAspectRatio: 16 / 9,
        croppingShowDimensions: true,
        croppingCoordinatesMode: "custom",
        showSkipCropButton: false,
        resourceType: "image",
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "bmp",
          "tiff",
          "svg",
          "heic",
          "heif",
          "avif",
          "ico",
          "raw",
        ],
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          const croppedUrl = buildCroppedUrl(result.info);
          setBlogForm((prev) => ({
            ...prev,
            image: croppedUrl,
          }));
          setBlogImageUploading(false);
        }
        if (result.event === "close") {
          setBlogImageUploading(false);
        }
      }
    );

    // Gallery widget for multiple images
    blogGalleryWidgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset:
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 10,
        multiple: true,
        resourceType: "image",
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "bmp",
          "tiff",
          "svg",
          "heic",
          "heif",
          "avif",
        ],
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          const imageUrl = result.info.secure_url;
          setBlogForm((prev) => ({
            ...prev,
            images: [...(prev.images || []), imageUrl],
          }));
        }
        if (result.event === "close") {
          setBlogGalleryUploading(false);
        }
      }
    );
  }, []);

  const openBlogImageUpload = () => {
    setBlogImageUploading(true);
    blogWidgetRef.current?.open();
  };

  const openBlogGalleryUpload = () => {
    setBlogGalleryUploading(true);
    blogGalleryWidgetRef.current?.open();
  };

  const removeBlogImage = () => {
    setBlogForm((prev) => ({ ...prev, image: "" }));
  };

  const removeBlogGalleryImage = (indexToRemove) => {
    setBlogForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const [propertyDetails, setPropertyDetails] = useState({
    title: "",
    description: "",
    price: 0,
    country: "",
    city: "",
    address: "",
    image: null,
    images: [],
    facilities: {
      bedrooms: 0,
      parkings: 0,
      bathrooms: 0,
    },
    propertyType: "sale",
    category: "residential",
    consultantId: null,
    userEmail: user?.email,
    // Turkish real estate fields
    listingNo: "",
    listingDate: null,
    area: { gross: 0, net: 0 },
    rooms: "",
    buildingAge: 0,
    floor: 0,
    totalFloors: 0,
    bathrooms: 0,
    heating: "",
    kitchen: "",
    balcony: false,
    elevator: false,
    parking: "",
    furnished: false,
    usageStatus: "",
    siteName: "",
    dues: 0,
    mortgageEligible: false,
    deedStatus: "",
    imarDurumu: "",
    // Land/Arsa features
    altyapiFeatures: [],
    konumFeatures: [],
    genelOzellikler: [],
    manzaraFeatures: [],
    // Interior/Exterior features
    interiorFeatures: [],
    exteriorFeatures: [],
    muhitFeatures: [],
    // Project-specific fields (Yurt İçi Proje)
    projeHakkinda: null,
    dairePlanlari: [],
    vaziyetPlani: "",
    iletisim: null,
    ozellikler: null,
  });

  // Check if current property type is local-project or international-project
  const isLocalProject = propertyDetails.propertyType === "local-project";
  const isInternationalProject = propertyDetails.propertyType === "international-project";

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const data = await getAdminAllBookings(token);
      setBookings(data.bookings || []);
      setTotalBookings(data.totalBookings || 0);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchBookings();
    }
  }, [token, isAdmin, fetchBookings]);

  // Fetch all contact messages
  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const data = await getAllContactMessages(token);
      setContactMessages(data.messages || []);
      setTotalMessages(data.totalMessages || 0);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchMessages();
    }
  }, [token, isAdmin, fetchMessages]);

  // Fetch all blogs
  const fetchBlogs = useCallback(async () => {
    if (!token) return;
    setBlogsLoading(true);
    try {
      const data = await getAllBlogsAdmin(token);
      setBlogs(data.blogs || []);
      setTotalBlogs(data.totalBlogs || 0);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setBlogsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchBlogs();
    }
  }, [token, isAdmin, fetchBlogs]);

  // Fetch all testimonials
  const fetchTestimonials = useCallback(async () => {
    if (!token) return;
    setTestimonialsLoading(true);
    try {
      const data = await getAllTestimonialsAdmin(token);
      setTestimonials(data.testimonials || []);
      setTotalTestimonials(data.totalTestimonials || 0);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setTestimonialsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchTestimonials();
    }
  }, [token, isAdmin, fetchTestimonials]);

  // Blog functions
  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      category: "",
      content: "",
      summary: "",
      image: "",
      images: [],
      published: true,
    });
  };

  const handleCreateBlog = async () => {
    if (!token) return;
    if (!blogForm.title || !blogForm.content || !blogForm.category) {
      toast.error("Please fill required fields (Title, Category, Content)", {
        position: "bottom-right",
      });
      return;
    }

    setBlogLoading(true);
    try {
      await createBlog(blogForm, token);
      toast.success("Blog created successfully!", {
        position: "bottom-right",
      });
      setBlogModalOpened(false);
      resetBlogForm();
      fetchBlogs();
    } catch (error) {
      console.error("Create blog error:", error);
    } finally {
      setBlogLoading(false);
    }
  };

  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);
    setBlogForm({
      title: blog.title || "",
      category: blog.category || "",
      content: blog.content || "",
      summary: blog.summary || "",
      image: blog.image || "",
      images: blog.images || [],
      published: blog.published !== undefined ? blog.published : true,
    });
    setEditBlogModalOpened(true);
  };

  const handleUpdateBlog = async () => {
    if (!selectedBlog || !token) return;

    setBlogLoading(true);
    try {
      await updateBlog(selectedBlog.id, blogForm, token);
      toast.success("Blog updated successfully!", {
        position: "bottom-right",
      });
      setEditBlogModalOpened(false);
      setSelectedBlog(null);
      resetBlogForm();
      fetchBlogs();
    } catch (error) {
      console.error("Update blog error:", error);
    } finally {
      setBlogLoading(false);
    }
  };

  const handleDeleteBlogClick = (blog) => {
    setBlogToDelete(blog);
    setDeleteBlogModalOpened(true);
  };

  const confirmDeleteBlog = async () => {
    if (!blogToDelete || !token) return;

    setBlogLoading(true);
    try {
      await deleteBlog(blogToDelete.id, token);
      toast.success("Blog deleted successfully!", {
        position: "bottom-right",
      });
      setDeleteBlogModalOpened(false);
      setBlogToDelete(null);
      fetchBlogs();
    } catch (error) {
      console.error("Delete blog error:", error);
    } finally {
      setBlogLoading(false);
    }
  };

  const handleTogglePublish = async (blog) => {
    if (!token) return;
    try {
      await toggleBlogPublish(blog.id, token);
      fetchBlogs();
    } catch (error) {
      console.error("Toggle publish error:", error);
    }
  };

  const resetAiMarketData = () => {
    setAiMarketData({
      city: "İstanbul",
      district: "",
      neighborhood: "",
      avgSalePrice: "",
      avgRentalPrice: "",
      monthlyChange: "",
      yearlyChange: "",
      demandLevel: "متوسط",
      autoPublish: false,
    });
  };

  const handleGenerateAIBlog = async () => {
    if (!token) return;
    if (!aiMarketData.city || !aiMarketData.district) {
      toast.error("Please provide at least City and District", {
        position: "bottom-right",
      });
      return;
    }

    setAiGenerating(true);
    try {
      const marketData = {
        city: aiMarketData.city,
        district: aiMarketData.district,
        neighborhood: aiMarketData.neighborhood || undefined,
        avgSalePrice: aiMarketData.avgSalePrice ? parseFloat(aiMarketData.avgSalePrice) : undefined,
        avgRentalPrice: aiMarketData.avgRentalPrice ? parseFloat(aiMarketData.avgRentalPrice) : undefined,
        priceIndex: {
          monthlyChange: aiMarketData.monthlyChange ? parseFloat(aiMarketData.monthlyChange) : undefined,
          yearlyChange: aiMarketData.yearlyChange ? parseFloat(aiMarketData.yearlyChange) : undefined,
        },
        demandLevel: aiMarketData.demandLevel,
      };

      await generateAIBlog(marketData, aiMarketData.autoPublish, token);
      
      toast.success("AI blog generated successfully! 🎉", {
        position: "bottom-right",
        autoClose: 5000,
      });
      
      setAiGenerateModalOpened(false);
      resetAiMarketData();
      fetchBlogs();
    } catch (error) {
      console.error("AI generation error:", error);
      // Error toast is handled by the API function
    } finally {
      setAiGenerating(false);
    }
  };

  // Testimonial functions
  const resetTestimonialForm = () => {
    setTestimonialForm({
      name: "",
      role: "",
      company: "",
      comment_tr: "",
      comment_en: "",
      staffBehavior: "",
      rating: 5,
      image: "",
      published: true,
    });
  };

  const handleCreateTestimonial = async () => {
    if (!token) return;
    if (
      !testimonialForm.name ||
      !testimonialForm.comment_tr ||
      !testimonialForm.comment_en
    ) {
      toast.error("Please fill required fields (Name, Comment TR, Comment EN)", {
        position: "bottom-right",
      });
      return;
    }

    setTestimonialLoading(true);
    try {
      const payload = {
        ...testimonialForm,
        comment:
          testimonialForm.comment_tr ||
          testimonialForm.comment_en ||
          "",
      };
      await createTestimonial(payload, token);
      toast.success("Testimonial created successfully!", {
        position: "bottom-right",
      });
      setTestimonialModalOpened(false);
      resetTestimonialForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Create testimonial error:", error);
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleEditTestimonial = (testimonial) => {
    setSelectedTestimonial(testimonial);
    const fallbackComment = testimonial.comment || "";
    setTestimonialForm({
      name: testimonial.name || "",
      role: testimonial.role || "",
      company: testimonial.company || "",
      comment_tr: testimonial.comment_tr || fallbackComment,
      comment_en: testimonial.comment_en || fallbackComment,
      staffBehavior: testimonial.staffBehavior || "",
      rating: testimonial.rating || 5,
      image: testimonial.image || "",
      published:
        testimonial.published !== undefined ? testimonial.published : true,
    });
    setEditTestimonialModalOpened(true);
  };

  const handleUpdateTestimonial = async () => {
    if (!selectedTestimonial || !token) return;
    if (
      !testimonialForm.name ||
      !testimonialForm.comment_tr ||
      !testimonialForm.comment_en
    ) {
      toast.error("Please fill required fields (Name, Comment TR, Comment EN)", {
        position: "bottom-right",
      });
      return;
    }

    setTestimonialLoading(true);
    try {
      const payload = {
        ...testimonialForm,
        comment:
          testimonialForm.comment_tr ||
          testimonialForm.comment_en ||
          "",
      };
      await updateTestimonial(
        selectedTestimonial.id,
        payload,
        token
      );
      toast.success("Testimonial updated successfully!", {
        position: "bottom-right",
      });
      setEditTestimonialModalOpened(false);
      setSelectedTestimonial(null);
      resetTestimonialForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Update testimonial error:", error);
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleDeleteTestimonialClick = (testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteTestimonialModalOpened(true);
  };

  const confirmDeleteTestimonial = async () => {
    if (!testimonialToDelete || !token) return;

    setTestimonialLoading(true);
    try {
      await deleteTestimonial(testimonialToDelete.id, token);
      toast.success("Testimonial deleted successfully!", {
        position: "bottom-right",
      });
      setDeleteTestimonialModalOpened(false);
      setTestimonialToDelete(null);
      fetchTestimonials();
    } catch (error) {
      console.error("Delete testimonial error:", error);
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleToggleTestimonialPublish = async (testimonial) => {
    if (!token) return;
    try {
      await toggleTestimonialPublish(testimonial.id, token);
      fetchTestimonials();
    } catch (error) {
      console.error("Toggle testimonial publish error:", error);
    }
  };

  // Handle delete contact message
  const handleDeleteMessage = async (messageId) => {
    if (!token || !messageId) return;

    try {
      await deleteContactMessage(messageId, token);
      toast.success("Message deleted successfully!", {
        position: "bottom-right",
      });
      fetchMessages();
    } catch (error) {
      console.error("Delete message error:", error);
      toast.error("Failed to delete message", {
        position: "bottom-right",
      });
    }
  };

  // Handle edit property
  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setEditModalOpened(true);
  };

  // Handle delete property
  const handleDeleteClick = (property) => {
    setPropertyToDelete(property);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete || !token) return;

    setDeleteLoading(true);
    try {
      await deleteResidency(propertyToDelete.id, token);
      toast.success("Delete operation completed successfully!", {
        position: "bottom-right",
      });
      setDeleteModalOpened(false);
      setPropertyToDelete(null);
      refetchProperties();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Consultant functions
  const resetConsultantForm = () => {
    setConsultantForm({
      name: "",
      title: "",
      title_en: "",
      title_tr: "",
      specialty: "",
      specialty_en: "",
      specialty_tr: "",
      experience: "",
      languages: [],
      rating: 5.0,
      reviews: 0,
      phone: "",
      whatsapp: "",
      email: "",
      linkedin: "",
      image: "",
      bio: "",
      bio_en: "",
      bio_tr: "",
      available: true,
    });
  };

  const handleCreateConsultant = async () => {
    if (!token) return;
    if (
      !consultantForm.name ||
      !consultantForm.email ||
      !consultantForm.phone
    ) {
      toast.error("Please fill required fields (Name, Email, Phone)", {
        position: "bottom-right",
      });
      return;
    }

    setConsultantLoading(true);
    try {
      await createConsultant(consultantForm, token);
      toast.success("Consultant added successfully!", {
        position: "bottom-right",
      });
      setConsultantModalOpened(false);
      resetConsultantForm();
      refetchConsultants();
    } catch (error) {
      console.error("Create consultant error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add consultant";
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    } finally {
      setConsultantLoading(false);
    }
  };

  const handleEditConsultant = (consultant) => {
    setSelectedConsultant(consultant);
    setConsultantForm({
      name: consultant.name || "",
      title: consultant.title || "",
      title_en: consultant.title_en || "",
      title_tr: consultant.title_tr || "",
      specialty: consultant.specialty || "",
      specialty_en: consultant.specialty_en || "",
      specialty_tr: consultant.specialty_tr || "",
      experience: consultant.experience || "",
      languages: consultant.languages || [],
      rating: consultant.rating || 5.0,
      reviews: consultant.reviews || 0,
      phone: consultant.phone || "",
      whatsapp: consultant.whatsapp || "",
      email: consultant.email || "",
      linkedin: consultant.linkedin || "",
      image: consultant.image || "",
      bio: consultant.bio || "",
      bio_en: consultant.bio_en || "",
      bio_tr: consultant.bio_tr || "",
      available:
        consultant.available !== undefined ? consultant.available : true,
    });
    setEditConsultantModalOpened(true);
  };

  const handleUpdateConsultant = async () => {
    if (!selectedConsultant || !token) return;

    setConsultantLoading(true);
    try {
      await updateConsultant(selectedConsultant.id, consultantForm, token);
      toast.success("Consultant updated successfully!", {
        position: "bottom-right",
      });
      setEditConsultantModalOpened(false);
      setSelectedConsultant(null);
      resetConsultantForm();
      refetchConsultants();
    } catch (error) {
      console.error("Update consultant error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update consultant";
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    } finally {
      setConsultantLoading(false);
    }
  };

  const handleDeleteConsultantClick = (consultant) => {
    setConsultantToDelete(consultant);
    setDeleteConsultantModalOpened(true);
  };

  const confirmDeleteConsultant = async () => {
    if (!consultantToDelete || !token) return;

    setConsultantLoading(true);
    try {
      await deleteConsultant(consultantToDelete.id, token);
      toast.success("Consultant deleted successfully!", {
        position: "bottom-right",
      });
      setDeleteConsultantModalOpened(false);
      setConsultantToDelete(null);
      refetchConsultants();
    } catch (error) {
      console.error("Delete consultant error:", error);
    } finally {
      setConsultantLoading(false);
    }
  };

  const handleToggleAvailability = async (consultant) => {
    if (!token) return;
    try {
      await toggleConsultantAvailability(consultant.id, token);
      refetchConsultants();
    } catch (error) {
      console.error("Toggle availability error:", error);
    }
  };

  // Dynamic step count based on property type
  // Local project: Konum -> Görseller -> Proje Detayları -> Olanaklar (4 steps)
  // International project: Konum -> Görseller -> Detaylar -> Proje Detayları -> Olanaklar (5 steps)
  // Regular: Konum -> Görseller -> Detaylar -> Olanaklar (4 steps)
  const maxSteps = isInternationalProject ? 5 : 4;

  const nextStep = () => {
    setActive((current) => (current < maxSteps ? current + 1 : current));
  };

  const prevStep = () => {
    setActive((current) => (current > 0 ? current - 1 : current));
  };

  const resetForm = () => {
    setPropertyDetails({
      title: "",
      description: "",
      description_en: "",
      description_tr: "",
      price: 0,
      country: "",
      city: "",
      address: "",
      image: null,
      images: [],
      facilities: {
        bedrooms: 0,
        parkings: 0,
        bathrooms: 0,
      },
      propertyType: "sale",
      category: "residential",
      consultantId: null,
      userEmail: user?.email,
      // Turkish real estate fields
      listingNo: "",
      listingDate: null,
      area: { gross: 0, net: 0 },
      rooms: "",
      buildingAge: 0,
      floor: 0,
      totalFloors: 0,
      bathrooms: 0,
      heating: "",
      kitchen: "",
      balcony: false,
      elevator: false,
      parking: "",
      furnished: false,
      usageStatus: "",
      siteName: "",
      dues: 0,
      mortgageEligible: false,
      deedStatus: "",
      imarDurumu: "",
      // Land/Arsa features
      altyapiFeatures: [],
      konumFeatures: [],
      genelOzellikler: [],
      manzaraFeatures: [],
      // Interior/Exterior features
      interiorFeatures: [],
      exteriorFeatures: [],
      muhitFeatures: [],
      // Project-specific fields
      projeHakkinda: null,
      dairePlanlari: [],
      vaziyetPlani: "",
      iletisim: null,
      ozellikler: null,
    });
    setActive(0);
  };

  // Loading states
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flexCenter bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flexCenter bg-gray-50">
        <Paper shadow="md" p="xl" radius="md" className="text-center max-w-md">
          <div className="mb-4 flex justify-center">
            <MdBlock className="text-red-500 text-7xl" />
          </div>
          <Title order={3} className="mb-2">
            Yetkisiz Erişim
          </Title>
          <Text color="dimmed" className="mb-4">
            Yönetim paneline erişim yetkiniz bulunmamaktadır.
          </Text>
          <Button onClick={() => navigate("/")} color="gray">
            Ana Sayfaya Dön
          </Button>
        </Paper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <Container size="xl">
        {/* Admin Header */}
        <Paper shadow="sm" p="lg" radius="md" className="mb-6">
          <div className="flexBetween flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary text-white p-3 rounded-full">
                <MdDashboard size={24} />
              </div>
              <div>
                <Title order={2} className="text-gray-800">
                  Yönetim Paneli
                </Title>
                <Text size="sm" color="dimmed">
                  Hoş geldiniz, {user?.name || user?.email}
                </Text>
              </div>
            </div>
            <Badge size="lg" color="green" variant="light">
              Admin
            </Badge>
          </div>
        </Paper>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeTab === "addProperty" ? "border-2 border-secondary" : ""
            }`}
            onClick={() => setActiveTab("addProperty")}
          >
            <Group>
              <div className="bg-secondary/10 text-secondary p-3 rounded-full">
                <MdAddHome size={24} />
              </div>
              <div>
                <Text fw={600}>Add New Property</Text>
                <Text size="sm" color="dimmed">
                  Add new property to system
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeTab === "propertyList" ? "border-2 border-blue-500" : ""
            }`}
            onClick={() => setActiveTab("propertyList")}
          >
            <Group>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <MdList size={24} />
              </div>
              <div>
                <Text fw={600}>Property List</Text>
                <Text size="sm" color="dimmed">
                  {properties?.length || 0} registered properties
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeTab === "consultants" ? "border-2 border-purple-500" : ""
            }`}
            onClick={() => setActiveTab("consultants")}
          >
            <Group>
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                <MdPeople size={24} />
              </div>
              <div>
                <Text fw={600}>Consultants</Text>
                <Text size="sm" color="dimmed">
                  {consultants?.length || 0} registered consultants
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeTab === "messages" ? "border-2 border-orange-500" : ""
            }`}
            onClick={() => setActiveTab("messages")}
          >
            <Group>
              <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
                <MdMessage size={24} />
              </div>
              <div>
                <Text fw={600}>Mesajlar</Text>
                <Text size="sm" color="dimmed">
                  {totalMessages} contact message
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeTab === "blogs" ? "border-2 border-teal-500" : ""
            }`}
            onClick={() => setActiveTab("blogs")}
          >
            <Group>
              <div className="bg-teal-100 text-teal-600 p-3 rounded-full">
                <MdArticle size={24} />
              </div>
              <div>
                <Text fw={600}>Blogs</Text>
                <Text size="sm" color="dimmed">
                  {totalBlogs} blog posts
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper
            shadow="sm"
            p="lg"
            radius="md"
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeTab === "testimonials" ? "border-2 border-pink-500" : ""
            }`}
            onClick={() => setActiveTab("testimonials")}
          >
            <Group>
              <div className="bg-pink-100 text-pink-600 p-3 rounded-full">
                <MdRateReview size={24} />
              </div>
              <div>
                <Text fw={600}>Testimonials</Text>
                <Text size="sm" color="dimmed">
                  {totalTestimonials} reviews
                </Text>
              </div>
            </Group>
          </Paper>
        </div>

        {/* Property List Section */}
        {activeTab === "propertyList" && (
          <Paper shadow="sm" p="xl" radius="md" className="mb-6">
            <div className="flexBetween mb-6">
              <div>
                <Title
                  order={3}
                  className="flex items-center gap-2 text-gray-800"
                >
                  <MdList className="text-blue-500" />
                  Property List
                </Title>
                <Text size="sm" color="dimmed" className="mt-1">
                  View, edit or delete all registered properties
                </Text>
              </div>
              <Button
                variant="light"
                color="blue"
                leftSection={<MdRefresh size={18} />}
                onClick={() => refetchProperties()}
                loading={propertiesLoading}
              >
                Yenile
              </Button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button
                variant={propertyFilter === "all" ? "filled" : "light"}
                color="gray"
                size="sm"
                onClick={() => setPropertyFilter("all")}
              >
                Tümü ({properties?.length || 0})
              </Button>
              <Button
                variant={propertyFilter === "sale" ? "filled" : "light"}
                color="green"
                size="sm"
                onClick={() => setPropertyFilter("sale")}
              >
                Satılık ({properties?.filter((p) => p.propertyType === "sale").length || 0})
              </Button>
              <Button
                variant={propertyFilter === "local-project" ? "filled" : "light"}
                color="blue"
                size="sm"
                onClick={() => setPropertyFilter("local-project")}
              >
                Yurt İçi Projeler ({properties?.filter((p) => p.propertyType === "local-project").length || 0})
              </Button>
              <Button
                variant={propertyFilter === "international-project" ? "filled" : "light"}
                color="grape"
                size="sm"
                onClick={() => setPropertyFilter("international-project")}
              >
                Yurt Dışı Projeler ({properties?.filter((p) => p.propertyType === "international-project").length || 0})
              </Button>
            </div>

            <Divider className="mb-6" />

            {propertiesLoading ? (
              <div className="flexCenter py-12">
                <Loader color="blue" />
              </div>
            ) : !properties || properties.length === 0 ? (
              <div className="text-center py-12">
                <MdHome size={64} className="text-gray-300 mx-auto mb-4" />
                <Text color="dimmed">No properties registered yet</Text>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Property</Table.Th>
                      <Table.Th>Konum</Table.Th>
                      <Table.Th>Fiyat</Table.Th>
                      <Table.Th>Tür</Table.Th>
                      <Table.Th>Consultant</Table.Th>
                      <Table.Th>İşlemler</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {properties
                      .filter((p) => propertyFilter === "all" || p.propertyType === propertyFilter)
                      .map((property) => (
                      <Table.Tr key={property.id}>
                        <Table.Td>
                          <div className="flex items-center gap-3">
                            {property.image && (
                              <img
                                src={property.image}
                                alt={property.title}
                                className="w-14 h-14 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <Text size="sm" fw={500} lineClamp={1} maw={200}>
                                {property.title}
                              </Text>
                              <Text
                                size="xs"
                                color="dimmed"
                                lineClamp={1}
                                maw={200}
                              >
                                {property.address}
                              </Text>
                            </div>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div className="flex items-center gap-1">
                            <MdHome size={16} className="text-gray-400" />
                            <Text size="sm">
                              {property.city}, {property.country}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} color="green">
                            ₺{property.price?.toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              property.propertyType === "sale"
                                ? "green"
                                : property.propertyType === "local-project"
                                ? "blue"
                                : "grape"
                            }
                            variant="light"
                          >
                            {property.propertyType === "sale"
                              ? "SATILIK"
                              : property.propertyType === "local-project"
                              ? "YURT İÇİ PROJE"
                              : "YURT DIŞI PROJE"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {property.consultant ? (
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={property.consultant.image}
                                size="sm"
                                radius="xl"
                              />
                              <div>
                                <Text size="xs" fw={500}>
                                  {property.consultant.name}
                                </Text>
                                <Text size="xs" color="dimmed">
                                  {property.consultant.phone}
                                </Text>
                              </div>
                            </div>
                          ) : (
                            <Badge color="gray" variant="light" size="sm">
                              Not Assigned
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="lg"
                              onClick={() => handleEditProperty(property)}
                              title="Düzenle"
                            >
                              <MdEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="lg"
                              onClick={() => handleDeleteClick(property)}
                              title="Sil"
                            >
                              <MdDelete size={18} />
                            </ActionIcon>
                            <Button
                              variant="subtle"
                              size="xs"
                              onClick={() =>
                                navigate(`/listing/${property.id}`)
                              }
                            >
                              Görüntüle
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            {/* Properties Summary */}
            {properties && properties.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Text size="sm" color="dimmed">
                    Total: {properties.length} properties
                  </Text>
                  <div className="flex gap-4">
                    <Text size="sm" color="dimmed">
                      Satılık:{" "}
                      {
                        properties.filter((p) => p.propertyType === "sale")
                          .length
                      }
                    </Text>
                    <Text size="sm" color="dimmed">
                      Yurt İçi Proje:{" "}
                      {
                        properties.filter(
                          (p) => p.propertyType === "local-project"
                        ).length
                      }
                    </Text>
                    <Text size="sm" color="dimmed">
                      Yurt Dışı Proje:{" "}
                      {
                        properties.filter(
                          (p) => p.propertyType === "international-project"
                        ).length
                      }
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Paper>
        )}

        {/* Consultants Section */}
        {activeTab === "consultants" && (
          <Paper shadow="sm" p="xl" radius="md" className="mb-6">
            <div className="flexBetween mb-6">
              <div>
                <Title
                  order={3}
                  className="flex items-center gap-2 text-gray-800"
                >
                  <MdPeople className="text-purple-500" />
                  Consultant Management
                </Title>
                <Text size="sm" color="dimmed" className="mt-1">
                  View, add, edit or delete consultants
                </Text>
              </div>
              <Group>
                <Button
                  variant="light"
                  color="purple"
                  leftSection={<MdRefresh size={18} />}
                  onClick={() => refetchConsultants()}
                  loading={consultantsLoading}
                >
                  Yenile
                </Button>
                <Button
                  color="grape"
                  leftSection={<MdPersonAdd size={18} />}
                  onClick={() => setConsultantModalOpened(true)}
                >
                  Add New Consultant
                </Button>
              </Group>
            </div>

            <Divider className="mb-6" />

            {consultantsLoading ? (
              <div className="flexCenter py-12">
                <Loader color="grape" />
              </div>
            ) : !consultants || consultants.length === 0 ? (
              <div className="text-center py-12">
                <MdPeople size={64} className="text-gray-300 mx-auto mb-4" />
                <Text color="dimmed">No consultants registered yet</Text>
                <Button
                  color="grape"
                  className="mt-4"
                  leftSection={<MdPersonAdd size={18} />}
                  onClick={() => setConsultantModalOpened(true)}
                >
                  Add First Consultant
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 40 }}></Table.Th>
                        <Table.Th>Consultant</Table.Th>
                        <Table.Th>Uzmanlık</Table.Th>
                        <Table.Th>Contact</Table.Th>
                        <Table.Th>İstatistik</Table.Th>
                        <Table.Th>Durum</Table.Th>
                        <Table.Th>İşlemler</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <SortableContext
                        items={consultantIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {orderedConsultants.map((consultant) => (
                          <SortableTableRow
                            key={consultant.id}
                            consultant={consultant}
                          >
                            <Table.Td>
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={consultant.image}
                                  alt={consultant.name}
                                  radius="xl"
                                  size="lg"
                                />
                                <div>
                                  <Text size="sm" fw={600}>
                                    {consultant.name}
                                  </Text>
                                  <Text size="xs" color="dimmed">
                                    {consultant.title}
                                  </Text>
                                  <Text size="xs" color="dimmed">
                                    {consultant.experience} deneyim
                                  </Text>
                                </div>
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <div>
                                <Text size="sm" fw={500}>
                                  {consultant.specialty}
                                </Text>
                                <Text size="xs" color="dimmed">
                                  {consultant.languages?.join(", ")}
                                </Text>
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <MdPhone
                                    size={14}
                                    className="text-gray-400"
                                  />
                                  <Text size="xs">{consultant.phone}</Text>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MdEmail
                                    size={14}
                                    className="text-gray-400"
                                  />
                                  <Text size="xs">{consultant.email}</Text>
                                </div>
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <div className="flex items-center gap-1">
                                    <FaStar className="text-amber-500 text-xs" />
                                    <Text size="sm" fw={600}>
                                      {consultant.rating}
                                    </Text>
                                  </div>
                                  <Text size="xs" color="dimmed">
                                    {consultant.reviews} yorum
                                  </Text>
                                </div>
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={consultant.available ? "green" : "gray"}
                                variant="light"
                                className="cursor-pointer"
                                onClick={() =>
                                  handleToggleAvailability(consultant)
                                }
                              >
                                {consultant.available ? "Müsait" : "Meşgul"}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  size="lg"
                                  onClick={() =>
                                    handleEditConsultant(consultant)
                                  }
                                  title="Düzenle"
                                >
                                  <MdEdit size={18} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="lg"
                                  onClick={() =>
                                    handleDeleteConsultantClick(consultant)
                                  }
                                  title="Sil"
                                >
                                  <MdDelete size={18} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </SortableTableRow>
                        ))}
                      </SortableContext>
                    </Table.Tbody>
                  </Table>
                </DndContext>
              </div>
            )}

            {/* Consultants Summary */}
            {consultants && consultants.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Text size="sm" color="dimmed">
                    Total: {consultants.length} consultants
                  </Text>
                  <div className="flex gap-4">
                    <Text size="sm" color="dimmed">
                      Müsait: {consultants.filter((c) => c.available).length}
                    </Text>
                    <Text size="sm" color="dimmed">
                      Meşgul: {consultants.filter((c) => !c.available).length}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Paper>
        )}

        {/* Contact Messages Section */}
        {activeTab === "messages" && (
          <Paper shadow="sm" p="xl" radius="md" className="mb-6">
            <div className="flexBetween mb-6">
              <div>
                <Title
                  order={3}
                  className="flex items-center gap-2 text-gray-800"
                >
                  <MdMessage className="text-orange-500" />
                  İletişim Mesajları
                </Title>
                <Text size="sm" color="dimmed" className="mt-1">
                  Form üzerinden gönderilen tüm mesajlar
                </Text>
              </div>
              <Group>
                <Button
                  variant="light"
                  color="orange"
                  leftSection={<MdRefresh size={18} />}
                  onClick={() => fetchMessages()}
                  loading={messagesLoading}
                >
                  Yenile
                </Button>
              </Group>
            </div>

            <Divider className="mb-6" />

            {messagesLoading ? (
              <div className="flexCenter py-12">
                <Loader color="orange" />
              </div>
            ) : contactMessages.length === 0 ? (
              <div className="text-center py-12">
                <MdMessage size={64} className="text-gray-300 mx-auto mb-4" />
                <Text color="dimmed">Henüz mesaj bulunmamaktadır</Text>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Gönderen</Table.Th>
                      <Table.Th>İletişim</Table.Th>
                      <Table.Th>ملک</Table.Th>
                      <Table.Th>Konu</Table.Th>
                      <Table.Th>Danışman</Table.Th>
                      <Table.Th>Mesaj</Table.Th>
                      <Table.Th>Tarih</Table.Th>
                      <Table.Th>Aksiyon</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {contactMessages.map((m) => (
                      <Table.Tr key={m.id}>
                        <Table.Td>
                          <div className="flex items-center gap-2">
                            <Avatar
                              radius="xl"
                              size="md"
                              color="cyan"
                              variant="light"
                            >
                              {m.name?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <div>
                              <Text size="sm" fw={500}>
                                {m.name}
                              </Text>
                              {m.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <MdPhone size={12} />
                                  {m.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MdEmail size={14} className="text-gray-400" />
                            <Text size="xs" className="truncate max-w-[180px]">
                              {m.email}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          {m.propertyTitle ? (
                            <div className="max-w-[200px]">
                              <Text
                                size="xs"
                                fw={500}
                                lineClamp={2}
                                className="text-green-600"
                              >
                                {m.propertyTitle}
                              </Text>
                              {m.propertyId && (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  compact
                                  onClick={() =>
                                    navigate(`/listing/${m.propertyId}`)
                                  }
                                  className="mt-1"
                                >
                                  مشاهده ملک
                                </Button>
                              )}
                            </div>
                          ) : (
                            <Badge color="gray" variant="light" size="sm">
                              عمومی
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {m.subject || "Property Inquiry"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {m.consultantName ? (
                            <div className="max-w-[180px]">
                              <Text size="xs" fw={500} className="text-emerald-600">
                                {m.consultantName}
                              </Text>
                              {m.consultantEmail && (
                                <Text size="xs" color="dimmed" lineClamp={1}>
                                  {m.consultantEmail}
                                </Text>
                              )}
                            </div>
                          ) : (
                            <Badge color="gray" variant="light" size="sm">
                              -
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" color="dimmed" lineClamp={2}>
                            {m.message}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" color="dimmed">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleString("tr-TR")
                              : "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteMessage(m.id)}
                              title="Sil"
                            >
                              <MdDelete size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Paper>
        )}

        {/* Blogs Section */}
        {activeTab === "blogs" && (
          <Paper shadow="sm" p="xl" radius="md" className="mb-6">
            <div className="flexBetween mb-6">
              <div>
                <Title
                  order={3}
                  className="flex items-center gap-2 text-gray-800"
                >
                  <MdArticle className="text-teal-500" />
                  Blog Management
                </Title>
                <Text size="sm" color="dimmed" className="mt-1">
                  Create, edit or delete blog posts
                </Text>
              </div>
              <Group>
                <Button
                  variant="light"
                  color="teal"
                  leftSection={<MdRefresh size={18} />}
                  onClick={() => fetchBlogs()}
                  loading={blogsLoading}
                >
                  Refresh
                </Button>
                <Button
                  variant="gradient"
                  gradient={{ from: "indigo", to: "cyan" }}
                  leftSection={<MdAdd size={18} />}
                  onClick={() => setAiGenerateModalOpened(true)}
                >
                  🤖 Generate with AI
                </Button>
                <Button
                  color="teal"
                  leftSection={<MdAdd size={18} />}
                  onClick={() => setBlogModalOpened(true)}
                >
                  Add New Blog
                </Button>
              </Group>
            </div>

            <Divider className="mb-6" />

            {blogsLoading ? (
              <div className="flexCenter py-12">
                <Loader color="teal" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <MdArticle size={64} className="text-gray-300 mx-auto mb-4" />
                <Text color="dimmed">No blog posts yet</Text>
                <Button
                  color="teal"
                  className="mt-4"
                  leftSection={<MdAdd size={18} />}
                  onClick={() => setBlogModalOpened(true)}
                >
                  Create First Blog
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Blog</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {blogs.map((blog) => (
                      <Table.Tr key={blog.id}>
                        <Table.Td>
                          <div className="flex items-center gap-3">
                            {blog.image && (
                              <img
                                src={blog.image}
                                alt={blog.title}
                                className="w-16 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <Text size="sm" fw={500} lineClamp={1} maw={250}>
                                {blog.title}
                              </Text>
                              {blog.summary && (
                                <Text
                                  size="xs"
                                  color="dimmed"
                                  lineClamp={1}
                                  maw={250}
                                >
                                  {blog.summary}
                                </Text>
                              )}
                            </div>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="teal" variant="light">
                            {blog.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={blog.published ? "green" : "gray"}
                            variant="light"
                            className="cursor-pointer"
                            onClick={() => handleTogglePublish(blog)}
                          >
                            {blog.published ? "Published" : "Draft"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" color="dimmed">
                            {new Date(blog.createdAt).toLocaleDateString(
                              "tr-TR"
                            )}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="lg"
                              onClick={() => handleEditBlog(blog)}
                              title="Edit"
                            >
                              <MdEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="lg"
                              onClick={() => handleDeleteBlogClick(blog)}
                              title="Delete"
                            >
                              <MdDelete size={18} />
                            </ActionIcon>
                            <Button
                              variant="subtle"
                              size="xs"
                              onClick={() => navigate(`/blog/${blog.id}`)}
                            >
                              View
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            {/* Blogs Summary */}
            {blogs.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Text size="sm" color="dimmed">
                    Total: {blogs.length} blogs
                  </Text>
                  <div className="flex gap-4">
                    <Text size="sm" color="dimmed">
                      Published: {blogs.filter((b) => b.published).length}
                    </Text>
                    <Text size="sm" color="dimmed">
                      Draft: {blogs.filter((b) => !b.published).length}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Paper>
        )}

        {/* Testimonials Section */}
        {activeTab === "testimonials" && (
          <Paper shadow="sm" p="xl" radius="md" className="mb-6">
            <div className="flexBetween mb-6">
              <div>
                <Title
                  order={3}
                  className="flex items-center gap-2 text-gray-800"
                >
                  <MdRateReview className="text-pink-500" />
                  Testimonials
                </Title>
                <Text size="sm" color="dimmed" className="mt-1">
                  Manage customer reviews and ratings
                </Text>
              </div>
              <Group>
                <Button
                  variant="light"
                  color="pink"
                  leftSection={<MdRefresh size={18} />}
                  onClick={() => fetchTestimonials()}
                  loading={testimonialsLoading}
                >
                  Refresh
                </Button>
                <Button
                  color="pink"
                  leftSection={<MdAdd size={18} />}
                  onClick={() => setTestimonialModalOpened(true)}
                >
                  Add Testimonial
                </Button>
              </Group>
            </div>

            <Divider className="mb-6" />

            {testimonialsLoading ? (
              <div className="flexCenter py-12">
                <Loader color="pink" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="text-center py-12">
                <MdRateReview size={64} className="text-gray-300 mx-auto mb-4" />
                <Text color="dimmed">No testimonials yet</Text>
                <Button
                  color="pink"
                  className="mt-4"
                  leftSection={<MdAdd size={18} />}
                  onClick={() => setTestimonialModalOpened(true)}
                >
                  Create First Testimonial
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Customer</Table.Th>
                      <Table.Th>Rating</Table.Th>
                      <Table.Th>Staff Behavior</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {testimonials.map((testimonial) => (
                      <Table.Tr key={testimonial.id}>
                        <Table.Td>
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={testimonial.image}
                              size="md"
                              radius="xl"
                              color="pink"
                            >
                              {testimonial.name?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <div>
                              <Text size="sm" fw={500}>
                                {testimonial.name}
                              </Text>
                              {(testimonial.role || testimonial.company) && (
                                <Text size="xs" color="dimmed">
                                  {[testimonial.role, testimonial.company]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </Text>
                              )}
                              <Text size="xs" color="dimmed" lineClamp={2}>
                                {testimonial.comment_tr ||
                                  testimonial.comment_en ||
                                  testimonial.comment}
                              </Text>
                            </div>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => (
                              <FaStar
                                key={index}
                                className={`text-xs ${
                                  index < Math.round(testimonial.rating || 0)
                                    ? "text-amber-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <Text size="xs" color="dimmed" className="ml-1">
                              {testimonial.rating || 0}/5
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          {testimonial.staffBehavior ? (
                            <Badge color="pink" variant="light">
                              {testimonial.staffBehavior}
                            </Badge>
                          ) : (
                            <Badge color="gray" variant="light">
                              -
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={testimonial.published ? "green" : "gray"}
                            variant="light"
                            className="cursor-pointer"
                            onClick={() =>
                              handleToggleTestimonialPublish(testimonial)
                            }
                          >
                            {testimonial.published ? "Published" : "Draft"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" color="dimmed">
                            {testimonial.createdAt
                              ? new Date(
                                  testimonial.createdAt
                                ).toLocaleDateString("tr-TR")
                              : "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="lg"
                              onClick={() => handleEditTestimonial(testimonial)}
                              title="Edit"
                            >
                              <MdEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="lg"
                              onClick={() =>
                                handleDeleteTestimonialClick(testimonial)
                              }
                              title="Delete"
                            >
                              <MdDelete size={18} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            {testimonials.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Text size="sm" color="dimmed">
                    Total: {testimonials.length} testimonials
                  </Text>
                  <div className="flex gap-4">
                    <Text size="sm" color="dimmed">
                      Published:{" "}
                      {testimonials.filter((t) => t.published).length}
                    </Text>
                    <Text size="sm" color="dimmed">
                      Draft: {testimonials.filter((t) => !t.published).length}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Paper>
        )}

        {/* Add Property Form */}
        {activeTab === "addProperty" && (
          <Paper shadow="sm" p="xl" radius="md">
            <div className="mb-6">
              <Title
                order={3}
                className="flex items-center gap-2 text-gray-800"
              >
                <MdAddHome className="text-secondary" />
                Save New Property
              </Title>
              <Text size="sm" color="dimmed" className="mt-1">
                Enter property information in the following steps
              </Text>
            </div>

            <Divider className="mb-6" />

            <Stepper
              key={isLocalProject ? "local-project-stepper" : isInternationalProject ? "international-project-stepper" : "regular-stepper"}
              active={active}
              onStepClick={setActive}
              breakpoint="sm"
              allowNextStepsSelect={false}
              color="green"
            >
              <Stepper.Step label="Konum" description="Adres ve şehir">
                <div className="mt-6">
                  <AddLocation
                    nextStep={nextStep}
                    propertyDetails={propertyDetails}
                    setPropertyDetails={setPropertyDetails}
                  />
                </div>
              </Stepper.Step>

              <Stepper.Step label="Görseller" description="Fotoğraf yükle">
                <div className="mt-6">
                  <UploadImage
                    prevStep={prevStep}
                    nextStep={nextStep}
                    propertyDetails={propertyDetails}
                    setPropertyDetails={setPropertyDetails}
                  />
                </div>
              </Stepper.Step>

              {/* Skip Detaylar for local projects - go directly to Proje Detayları */}
              {!isLocalProject && (
                <Stepper.Step label="Detaylar" description="Ana özellikler">
                  <div className="mt-6">
                    <BasicDetails
                      prevStep={prevStep}
                      nextStep={nextStep}
                      propertyDetails={propertyDetails}
                      setPropertyDetails={setPropertyDetails}
                    />
                  </div>
                </Stepper.Step>
              )}

              {(isLocalProject || isInternationalProject) && (
                <Stepper.Step label="Proje Detayları" description="Proje bilgileri">
                  <div className="mt-6">
                    <ProjectDetails
                      prevStep={prevStep}
                      nextStep={nextStep}
                      propertyDetails={propertyDetails}
                      setPropertyDetails={setPropertyDetails}
                    />
                  </div>
                </Stepper.Step>
              )}

              <Stepper.Step label="Olanaklar" description="Oda sayısı">
                <div className="mt-6">
                  <Facilities
                    prevStep={prevStep}
                    propertyDetails={propertyDetails}
                    setPropertyDetails={setPropertyDetails}
                    setOpened={() => {}} // Not used in page mode
                    setActiveStep={setActive}
                    onSuccess={resetForm}
                    isPageMode={true}
                  />
                </div>
              </Stepper.Step>

              <Stepper.Completed>
                <div className="text-center py-8">
                  <div className="mb-4 flex justify-center">
                    <MdCheckCircle className="text-green-500 text-7xl" />
                  </div>
                  <Title order={3} className="mb-2">
                    Property saved successfully!
                  </Title>
                  <Text color="dimmed" className="mb-6">
                    New property added to the list and will be displayed on the
                    site.
                  </Text>
                  <Group position="center">
                    <Button onClick={resetForm} color="green">
                      Save New Property
                    </Button>
                    <Button
                      onClick={() => navigate("/listing")}
                      variant="outline"
                    >
                      Property Listni Görüntüle
                    </Button>
                  </Group>
                </div>
              </Stepper.Completed>
            </Stepper>
          </Paper>
        )}

        {/* Edit Property Modal */}
        <EditPropertyModal
          opened={editModalOpened}
          setOpened={setEditModalOpened}
          property={selectedProperty}
          onSuccess={() => {
            refetchProperties();
          }}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={() => {
            setDeleteModalOpened(false);
            setPropertyToDelete(null);
          }}
          title={
            <Text fw={600} color="red">
              Delete Property
            </Text>
          }
          centered
        >
          <div className="py-4">
            <Text size="sm" color="dimmed" mb="md">
              Are you sure you want to delete this property? This action cannot
              be undone.
            </Text>
            {propertyToDelete && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                {propertyToDelete.image && (
                  <img
                    src={propertyToDelete.image}
                    alt={propertyToDelete.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <Text size="sm" fw={500}>
                    {propertyToDelete.title}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {propertyToDelete.city}, {propertyToDelete.country}
                  </Text>
                  <Text size="xs" color="green" fw={500}>
                    ₺{propertyToDelete.price?.toLocaleString()}
                  </Text>
                </div>
              </div>
            )}
            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setDeleteModalOpened(false);
                  setPropertyToDelete(null);
                }}
              >
                İptal
              </Button>
              <Button
                color="red"
                onClick={confirmDelete}
                loading={deleteLoading}
              >
                Sil
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Add Consultant Modal */}
        <Modal
          opened={consultantModalOpened}
          onClose={() => {
            setConsultantModalOpened(false);
            resetConsultantForm();
          }}
          title={
            <Text fw={600} color="grape">
              <div className="flex items-center gap-2">
                <MdPersonAdd />
                Add New Consultant
              </div>
            </Text>
          }
          size="lg"
          centered
        >
          <div className="space-y-4 py-2">
            <TextInput
              label="Ad Soyad / Full Name"
              placeholder="Consultant name"
              required
              value={consultantForm.name}
              onChange={(e) =>
                setConsultantForm({ ...consultantForm, name: e.target.value })
              }
            />

            {/* Title - Bilingual */}
            <div className="p-3 bg-blue-50 rounded-lg space-y-3">
              <Text size="sm" fw={600} c="blue">
                Title (Bilingual)
              </Text>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Title (English)"
                  placeholder="e.g., Senior Property Advisor"
                  value={consultantForm.title_en}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      title_en: e.target.value,
                      title: e.target.value || consultantForm.title_tr,
                    })
                  }
                />
                <TextInput
                  label="Ünvan (Türkçe)"
                  placeholder="Örn: Kıdemli Gayrimenkul Danışmanı"
                  value={consultantForm.title_tr}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      title_tr: e.target.value,
                      title: consultantForm.title_en || e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Specialty - Bilingual */}
            <div className="p-3 bg-green-50 rounded-lg space-y-3">
              <Text size="sm" fw={600} c="green">
                Specialty (Bilingual)
              </Text>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Specialty (English)"
                  placeholder="e.g., Luxury Villas & Apartments"
                  value={consultantForm.specialty_en}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      specialty_en: e.target.value,
                      specialty: e.target.value || consultantForm.specialty_tr,
                    })
                  }
                />
                <TextInput
                  label="Uzmanlık Alanı (Türkçe)"
                  placeholder="Örn: Lüks Villalar ve Daireler"
                  value={consultantForm.specialty_tr}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      specialty_tr: e.target.value,
                      specialty: consultantForm.specialty_en || e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <TextInput
              label="Deneyim / Experience"
              placeholder="e.g., 10 years"
              value={consultantForm.experience}
              onChange={(e) =>
                setConsultantForm({
                  ...consultantForm,
                  experience: e.target.value,
                })
              }
            />

            <MultiSelect
              label="Diller / Languages"
              placeholder="Select languages spoken"
              data={languageOptions}
              value={consultantForm.languages}
              onChange={(value) =>
                setConsultantForm({ ...consultantForm, languages: value })
              }
              searchable
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Email"
                placeholder="email@example.com"
                required
                value={consultantForm.email}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    email: e.target.value,
                  })
                }
              />
              <TextInput
                label="Telefon / Phone"
                placeholder="+90 5XX XXX XXXX"
                required
                value={consultantForm.phone}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="WhatsApp"
                placeholder="+905XXXXXXXXX"
                value={consultantForm.whatsapp}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    whatsapp: e.target.value,
                  })
                }
              />
              <TextInput
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/..."
                value={consultantForm.linkedin}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    linkedin: e.target.value,
                  })
                }
              />
            </div>

            {/* Profile Image Upload */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Profil Fotoğrafı / Profile Photo
              </Text>
              {consultantForm.image ? (
                <div className="relative inline-block">
                  <img
                    src={consultantForm.image}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    radius="xl"
                    className="absolute top-0 right-0"
                    onClick={removeConsultantImage}
                  >
                    <MdClose size={14} />
                  </ActionIcon>
                </div>
              ) : (
                <div
                  onClick={openConsultantImageUpload}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-grape-500 hover:bg-gray-50 transition-colors"
                >
                  <MdOutlineCloudUpload size={28} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Upload</span>
                </div>
              )}
              {consultantForm.image && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={openConsultantImageUpload}
                  loading={imageUploading}
                >
                  Change
                </Button>
              )}
            </div>

            {/* Biography - Bilingual */}
            <div className="p-3 bg-purple-50 rounded-lg space-y-3">
              <Text size="sm" fw={600} c="grape">
                Biography (Bilingual)
              </Text>
              <Textarea
                label="Biography (English)"
                placeholder="Short description about consultant in English"
                rows={3}
                value={consultantForm.bio_en}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    bio_en: e.target.value,
                    bio: e.target.value || consultantForm.bio_tr,
                  })
                }
              />
              <Textarea
                label="Biyografi (Türkçe)"
                placeholder="Danışman hakkında kısa açıklama"
                rows={3}
                value={consultantForm.bio_tr}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    bio_tr: e.target.value,
                    bio: consultantForm.bio_en || e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <NumberInput
                label="Puan / Rating"
                placeholder="5.0"
                min={0}
                max={5}
                step={0.1}
                decimalScale={1}
                value={consultantForm.rating}
                onChange={(value) =>
                  setConsultantForm({ ...consultantForm, rating: value || 0 })
                }
              />
              <NumberInput
                label="Yorum Sayısı / Reviews"
                placeholder="0"
                min={0}
                value={consultantForm.reviews}
                onChange={(value) =>
                  setConsultantForm({ ...consultantForm, reviews: value || 0 })
                }
              />
            </div>

            <Switch
              label="Müsait / Available"
              checked={consultantForm.available}
              onChange={(e) =>
                setConsultantForm({
                  ...consultantForm,
                  available: e.currentTarget.checked,
                })
              }
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setConsultantModalOpened(false);
                  resetConsultantForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="grape"
                onClick={handleCreateConsultant}
                loading={consultantLoading}
              >
                Add Consultant
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Edit Consultant Modal */}
        <Modal
          opened={editConsultantModalOpened}
          onClose={() => {
            setEditConsultantModalOpened(false);
            setSelectedConsultant(null);
            resetConsultantForm();
          }}
          title={
            <Text fw={600} color="blue">
              <div className="flex items-center gap-2">
                <MdEdit />
                Edit Consultant
              </div>
            </Text>
          }
          size="lg"
          centered
        >
          <div className="space-y-4 py-2">
            <TextInput
              label="Ad Soyad / Full Name"
              placeholder="Consultant name"
              required
              value={consultantForm.name}
              onChange={(e) =>
                setConsultantForm({ ...consultantForm, name: e.target.value })
              }
            />

            {/* Title - Bilingual */}
            <div className="p-3 bg-blue-50 rounded-lg space-y-3">
              <Text size="sm" fw={600} c="blue">
                Title (Bilingual)
              </Text>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Title (English)"
                  placeholder="e.g., Senior Property Advisor"
                  value={consultantForm.title_en}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      title_en: e.target.value,
                      title: e.target.value || consultantForm.title_tr,
                    })
                  }
                />
                <TextInput
                  label="Ünvan (Türkçe)"
                  placeholder="Örn: Kıdemli Gayrimenkul Danışmanı"
                  value={consultantForm.title_tr}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      title_tr: e.target.value,
                      title: consultantForm.title_en || e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Specialty - Bilingual */}
            <div className="p-3 bg-green-50 rounded-lg space-y-3">
              <Text size="sm" fw={600} c="green">
                Specialty (Bilingual)
              </Text>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Specialty (English)"
                  placeholder="e.g., Luxury Villas & Apartments"
                  value={consultantForm.specialty_en}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      specialty_en: e.target.value,
                      specialty: e.target.value || consultantForm.specialty_tr,
                    })
                  }
                />
                <TextInput
                  label="Uzmanlık Alanı (Türkçe)"
                  placeholder="Örn: Lüks Villalar ve Daireler"
                  value={consultantForm.specialty_tr}
                  onChange={(e) =>
                    setConsultantForm({
                      ...consultantForm,
                      specialty_tr: e.target.value,
                      specialty: consultantForm.specialty_en || e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <TextInput
              label="Deneyim / Experience"
              placeholder="e.g., 10 years"
              value={consultantForm.experience}
              onChange={(e) =>
                setConsultantForm({
                  ...consultantForm,
                  experience: e.target.value,
                })
              }
            />

            <MultiSelect
              label="Diller / Languages"
              placeholder="Select languages spoken"
              data={languageOptions}
              value={consultantForm.languages}
              onChange={(value) =>
                setConsultantForm({ ...consultantForm, languages: value })
              }
              searchable
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Email"
                placeholder="email@example.com"
                required
                value={consultantForm.email}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    email: e.target.value,
                  })
                }
              />
              <TextInput
                label="Telefon / Phone"
                placeholder="+90 5XX XXX XXXX"
                required
                value={consultantForm.phone}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="WhatsApp"
                placeholder="+905XXXXXXXXX"
                value={consultantForm.whatsapp}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    whatsapp: e.target.value,
                  })
                }
              />
              <TextInput
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/..."
                value={consultantForm.linkedin}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    linkedin: e.target.value,
                  })
                }
              />
            </div>

            {/* Profile Image Upload */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Profil Fotoğrafı / Profile Photo
              </Text>
              {consultantForm.image ? (
                <div className="relative inline-block">
                  <img
                    src={consultantForm.image}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    radius="xl"
                    className="absolute top-0 right-0"
                    onClick={removeConsultantImage}
                  >
                    <MdClose size={14} />
                  </ActionIcon>
                </div>
              ) : (
                <div
                  onClick={openConsultantImageUpload}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
                >
                  <MdOutlineCloudUpload size={28} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Upload</span>
                </div>
              )}
              {consultantForm.image && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={openConsultantImageUpload}
                  loading={imageUploading}
                >
                  Change
                </Button>
              )}
            </div>

            {/* Biography - Bilingual */}
            <div className="p-3 bg-purple-50 rounded-lg space-y-3">
              <Text size="sm" fw={600} c="grape">
                Biography (Bilingual)
              </Text>
              <Textarea
                label="Biography (English)"
                placeholder="Short description about consultant in English"
                rows={3}
                value={consultantForm.bio_en}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    bio_en: e.target.value,
                    bio: e.target.value || consultantForm.bio_tr,
                  })
                }
              />
              <Textarea
                label="Biyografi (Türkçe)"
                placeholder="Danışman hakkında kısa açıklama"
                rows={3}
                value={consultantForm.bio_tr}
                onChange={(e) =>
                  setConsultantForm({
                    ...consultantForm,
                    bio_tr: e.target.value,
                    bio: consultantForm.bio_en || e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <NumberInput
                label="Puan / Rating"
                placeholder="5.0"
                min={0}
                max={5}
                step={0.1}
                decimalScale={1}
                value={consultantForm.rating}
                onChange={(value) =>
                  setConsultantForm({ ...consultantForm, rating: value || 0 })
                }
              />
              <NumberInput
                label="Yorum Sayısı / Reviews"
                placeholder="0"
                min={0}
                value={consultantForm.reviews}
                onChange={(value) =>
                  setConsultantForm({ ...consultantForm, reviews: value || 0 })
                }
              />
            </div>

            <Switch
              label="Müsait / Available"
              checked={consultantForm.available}
              onChange={(e) =>
                setConsultantForm({
                  ...consultantForm,
                  available: e.currentTarget.checked,
                })
              }
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setEditConsultantModalOpened(false);
                  setSelectedConsultant(null);
                  resetConsultantForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleUpdateConsultant}
                loading={consultantLoading}
              >
                Update
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Delete Consultant Confirmation Modal */}
        <Modal
          opened={deleteConsultantModalOpened}
          onClose={() => {
            setDeleteConsultantModalOpened(false);
            setConsultantToDelete(null);
          }}
          title={
            <Text fw={600} color="red">
              Delete Consultant
            </Text>
          }
          centered
        >
          <div className="py-4">
            <Text size="sm" color="dimmed" mb="md">
              Are you sure you want to delete this consultant? This action
              cannot be undone.
            </Text>
            {consultantToDelete && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                {consultantToDelete.image && (
                  <Avatar
                    src={consultantToDelete.image}
                    alt={consultantToDelete.name}
                    size="lg"
                    radius="xl"
                  />
                )}
                <div>
                  <Text size="sm" fw={500}>
                    {consultantToDelete.name}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {consultantToDelete.title}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {consultantToDelete.email}
                  </Text>
                </div>
              </div>
            )}
            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setDeleteConsultantModalOpened(false);
                  setConsultantToDelete(null);
                }}
              >
                İptal
              </Button>
              <Button
                color="red"
                onClick={confirmDeleteConsultant}
                loading={consultantLoading}
              >
                Sil
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Add Testimonial Modal */}
        <Modal
          opened={testimonialModalOpened}
          onClose={() => {
            setTestimonialModalOpened(false);
            resetTestimonialForm();
          }}
          title={
            <Text fw={600} color="pink">
              <div className="flex items-center gap-2">
                <MdAdd />
                Add Testimonial
              </div>
            </Text>
          }
          size="lg"
          centered
        >
          <div className="space-y-4 py-2">
            <div>
              <Text size="sm" fw={500} mb={4}>
                Customer Photo
              </Text>
              {testimonialForm.image ? (
                <div className="relative inline-block">
                  <img
                    src={testimonialForm.image}
                    alt={testimonialForm.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    radius="xl"
                    className="absolute -top-1 -right-1"
                    onClick={removeTestimonialImage}
                  >
                    <MdClose size={14} />
                  </ActionIcon>
                </div>
              ) : (
                <div
                  onClick={openTestimonialImageUpload}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-pink-400 hover:bg-gray-50 transition-colors"
                >
                  <MdOutlineCloudUpload size={24} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                </div>
              )}
              {testimonialForm.image && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={openTestimonialImageUpload}
                  loading={testimonialImageUploading}
                >
                  Change Photo
                </Button>
              )}
            </div>

            <TextInput
              label="Name"
              placeholder="Customer name"
              required
              value={testimonialForm.name}
              onChange={(e) =>
                setTestimonialForm({ ...testimonialForm, name: e.target.value })
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Role"
                placeholder="Investor, Buyer, etc."
                value={testimonialForm.role}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    role: e.target.value,
                  })
                }
              />
              <TextInput
                label="Company"
                placeholder="Optional"
                value={testimonialForm.company}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    company: e.target.value,
                  })
                }
              />
            </div>

            <TextInput
              label="Staff Behavior"
              placeholder="Friendly, Professional, etc."
              value={testimonialForm.staffBehavior}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  staffBehavior: e.target.value,
                })
              }
            />

            <NumberInput
              label="Rating (1-5)"
              min={1}
              max={5}
              step={1}
              value={testimonialForm.rating}
              onChange={(value) =>
                setTestimonialForm({ ...testimonialForm, rating: value })
              }
            />

            <Textarea
              label="Comment (TR)"
              placeholder="Customer review (Turkish)..."
              required
              rows={4}
              value={testimonialForm.comment_tr}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  comment_tr: e.target.value,
                })
              }
            />

            <Textarea
              label="Comment (EN)"
              placeholder="Customer review (English)..."
              required
              rows={4}
              value={testimonialForm.comment_en}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  comment_en: e.target.value,
                })
              }
            />

            <Switch
              label="Publish immediately"
              checked={testimonialForm.published}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  published: e.currentTarget.checked,
                })
              }
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setTestimonialModalOpened(false);
                  resetTestimonialForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="pink"
                onClick={handleCreateTestimonial}
                loading={testimonialLoading}
              >
                Create
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Edit Testimonial Modal */}
        <Modal
          opened={editTestimonialModalOpened}
          onClose={() => {
            setEditTestimonialModalOpened(false);
            setSelectedTestimonial(null);
            resetTestimonialForm();
          }}
          title={
            <Text fw={600} color="pink">
              <div className="flex items-center gap-2">
                <MdEdit />
                Edit Testimonial
              </div>
            </Text>
          }
          size="lg"
          centered
        >
          <div className="space-y-4 py-2">
            <div>
              <Text size="sm" fw={500} mb={4}>
                Customer Photo
              </Text>
              {testimonialForm.image ? (
                <div className="relative inline-block">
                  <img
                    src={testimonialForm.image}
                    alt={testimonialForm.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    radius="xl"
                    className="absolute -top-1 -right-1"
                    onClick={removeTestimonialImage}
                  >
                    <MdClose size={14} />
                  </ActionIcon>
                </div>
              ) : (
                <div
                  onClick={openTestimonialImageUpload}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-pink-400 hover:bg-gray-50 transition-colors"
                >
                  <MdOutlineCloudUpload size={24} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                </div>
              )}
              {testimonialForm.image && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={openTestimonialImageUpload}
                  loading={testimonialImageUploading}
                >
                  Change Photo
                </Button>
              )}
            </div>

            <TextInput
              label="Name"
              placeholder="Customer name"
              required
              value={testimonialForm.name}
              onChange={(e) =>
                setTestimonialForm({ ...testimonialForm, name: e.target.value })
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Role"
                placeholder="Investor, Buyer, etc."
                value={testimonialForm.role}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    role: e.target.value,
                  })
                }
              />
              <TextInput
                label="Company"
                placeholder="Optional"
                value={testimonialForm.company}
                onChange={(e) =>
                  setTestimonialForm({
                    ...testimonialForm,
                    company: e.target.value,
                  })
                }
              />
            </div>

            <TextInput
              label="Staff Behavior"
              placeholder="Friendly, Professional, etc."
              value={testimonialForm.staffBehavior}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  staffBehavior: e.target.value,
                })
              }
            />

            <NumberInput
              label="Rating (1-5)"
              min={1}
              max={5}
              step={1}
              value={testimonialForm.rating}
              onChange={(value) =>
                setTestimonialForm({ ...testimonialForm, rating: value })
              }
            />

            <Textarea
              label="Comment (TR)"
              placeholder="Customer review (Turkish)..."
              required
              rows={4}
              value={testimonialForm.comment_tr}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  comment_tr: e.target.value,
                })
              }
            />

            <Textarea
              label="Comment (EN)"
              placeholder="Customer review (English)..."
              required
              rows={4}
              value={testimonialForm.comment_en}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  comment_en: e.target.value,
                })
              }
            />

            <Switch
              label="Published"
              checked={testimonialForm.published}
              onChange={(e) =>
                setTestimonialForm({
                  ...testimonialForm,
                  published: e.currentTarget.checked,
                })
              }
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setEditTestimonialModalOpened(false);
                  setSelectedTestimonial(null);
                  resetTestimonialForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="pink"
                onClick={handleUpdateTestimonial}
                loading={testimonialLoading}
              >
                Update
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Delete Testimonial Confirmation Modal */}
        <Modal
          opened={deleteTestimonialModalOpened}
          onClose={() => {
            setDeleteTestimonialModalOpened(false);
            setTestimonialToDelete(null);
          }}
          title={
            <Text fw={600} color="red">
              Delete Testimonial
            </Text>
          }
          centered
        >
          <div className="py-4">
            <Text size="sm" color="dimmed" mb="md">
              Are you sure you want to delete this testimonial? This action
              cannot be undone.
            </Text>
            {testimonialToDelete && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                {testimonialToDelete.image && (
                  <Avatar
                    src={testimonialToDelete.image}
                    alt={testimonialToDelete.name}
                    size="lg"
                    radius="xl"
                  />
                )}
                <div>
                  <Text size="sm" fw={500}>
                    {testimonialToDelete.name}
                  </Text>
                  <Text size="xs" color="dimmed" lineClamp={2}>
                    {testimonialToDelete.comment_tr ||
                      testimonialToDelete.comment_en ||
                      testimonialToDelete.comment}
                  </Text>
                </div>
              </div>
            )}
            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setDeleteTestimonialModalOpened(false);
                  setTestimonialToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={confirmDeleteTestimonial}
                loading={testimonialLoading}
              >
                Delete
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Add Blog Modal */}
        <Modal
          opened={blogModalOpened}
          onClose={() => {
            setBlogModalOpened(false);
            resetBlogForm();
          }}
          title={
            <Text fw={600} color="teal">
              <div className="flex items-center gap-2">
                <MdAdd />
                Add New Blog
              </div>
            </Text>
          }
          size="xl"
          centered
        >
          <div className="space-y-4 py-2">
            <TextInput
              label="Title"
              placeholder="Blog title"
              required
              value={blogForm.title}
              onChange={(e) =>
                setBlogForm({ ...blogForm, title: e.target.value })
              }
            />

            <TextInput
              label="Category"
              placeholder="e.g., Real Estate, Investment, Tips"
              required
              value={blogForm.category}
              onChange={(e) =>
                setBlogForm({ ...blogForm, category: e.target.value })
              }
            />

            <Textarea
              label="Summary"
              placeholder="Brief summary of the blog post"
              rows={2}
              value={blogForm.summary}
              onChange={(e) =>
                setBlogForm({ ...blogForm, summary: e.target.value })
              }
            />

            <Textarea
              label="Content"
              placeholder="Full blog content..."
              required
              rows={10}
              value={blogForm.content}
              onChange={(e) =>
                setBlogForm({ ...blogForm, content: e.target.value })
              }
            />

            {/* Blog Image Upload */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Featured Image
              </Text>
              {blogForm.image ? (
                <div className="relative inline-block">
                  <img
                    src={blogForm.image}
                    alt="Blog"
                    className="w-full max-w-md h-32 rounded-lg object-cover border-2 border-gray-200"
                  />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    radius="xl"
                    className="absolute top-2 right-2"
                    onClick={removeBlogImage}
                  >
                    <MdClose size={14} />
                  </ActionIcon>
                </div>
              ) : (
                <div
                  onClick={openBlogImageUpload}
                  className="w-full max-w-md h-32 rounded-lg border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-teal-500 hover:bg-gray-50 transition-colors"
                >
                  <MdOutlineCloudUpload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-400 mt-1">
                    Click to upload cover image
                  </span>
                </div>
              )}
              {blogForm.image && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={openBlogImageUpload}
                  loading={blogImageUploading}
                >
                  Change Image
                </Button>
              )}
            </div>

            {/* Blog Gallery Images */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Gallery Images (Optional)
              </Text>
              <div className="flex flex-wrap gap-2 mb-2">
                {blogForm.images && blogForm.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    />
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="xs"
                      radius="xl"
                      className="absolute -top-1 -right-1"
                      onClick={() => removeBlogGalleryImage(index)}
                    >
                      <MdClose size={10} />
                    </ActionIcon>
                  </div>
                ))}
                <div
                  onClick={openBlogGalleryUpload}
                  className={`w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-teal-500 hover:bg-gray-50 transition-colors ${blogGalleryUploading ? 'opacity-50' : ''}`}
                >
                  {blogGalleryUploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <MdOutlineCloudUpload size={20} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">Add</span>
                    </>
                  )}
                </div>
              </div>
              <Text size="xs" c="dimmed">
                Add multiple images for the blog gallery (max 10)
              </Text>
            </div>

            <Switch
              label="Publish immediately"
              checked={blogForm.published}
              onChange={(e) =>
                setBlogForm({
                  ...blogForm,
                  published: e.currentTarget.checked,
                })
              }
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setBlogModalOpened(false);
                  resetBlogForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="teal"
                onClick={handleCreateBlog}
                loading={blogLoading}
              >
                Create Blog
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Edit Blog Modal */}
        <Modal
          opened={editBlogModalOpened}
          onClose={() => {
            setEditBlogModalOpened(false);
            setSelectedBlog(null);
            resetBlogForm();
          }}
          title={
            <Text fw={600} color="blue">
              <div className="flex items-center gap-2">
                <MdEdit />
                Edit Blog
              </div>
            </Text>
          }
          size="xl"
          centered
        >
          <div className="space-y-4 py-2">
            <TextInput
              label="Title"
              placeholder="Blog title"
              required
              value={blogForm.title}
              onChange={(e) =>
                setBlogForm({ ...blogForm, title: e.target.value })
              }
            />

            <TextInput
              label="Category"
              placeholder="e.g., Real Estate, Investment, Tips"
              required
              value={blogForm.category}
              onChange={(e) =>
                setBlogForm({ ...blogForm, category: e.target.value })
              }
            />

            <Textarea
              label="Summary"
              placeholder="Brief summary of the blog post"
              rows={2}
              value={blogForm.summary}
              onChange={(e) =>
                setBlogForm({ ...blogForm, summary: e.target.value })
              }
            />

            <Textarea
              label="Content"
              placeholder="Full blog content..."
              required
              rows={10}
              value={blogForm.content}
              onChange={(e) =>
                setBlogForm({ ...blogForm, content: e.target.value })
              }
            />

            {/* Blog Image Upload */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Featured Image
              </Text>
              {blogForm.image ? (
                <div className="relative inline-block">
                  <img
                    src={blogForm.image}
                    alt="Blog"
                    className="w-full max-w-md h-32 rounded-lg object-cover border-2 border-gray-200"
                  />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    radius="xl"
                    className="absolute top-2 right-2"
                    onClick={removeBlogImage}
                  >
                    <MdClose size={14} />
                  </ActionIcon>
                </div>
              ) : (
                <div
                  onClick={openBlogImageUpload}
                  className="w-full max-w-md h-32 rounded-lg border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
                >
                  <MdOutlineCloudUpload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-400 mt-1">
                    Click to upload cover image
                  </span>
                </div>
              )}
              {blogForm.image && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={openBlogImageUpload}
                  loading={blogImageUploading}
                >
                  Change Image
                </Button>
              )}
            </div>

            {/* Blog Gallery Images */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Gallery Images (Optional)
              </Text>
              <div className="flex flex-wrap gap-2 mb-2">
                {blogForm.images && blogForm.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    />
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="xs"
                      radius="xl"
                      className="absolute -top-1 -right-1"
                      onClick={() => removeBlogGalleryImage(index)}
                    >
                      <MdClose size={10} />
                    </ActionIcon>
                  </div>
                ))}
                <div
                  onClick={openBlogGalleryUpload}
                  className={`w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors ${blogGalleryUploading ? 'opacity-50' : ''}`}
                >
                  {blogGalleryUploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <MdOutlineCloudUpload size={20} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">Add</span>
                    </>
                  )}
                </div>
              </div>
              <Text size="xs" c="dimmed">
                Add multiple images for the blog gallery (max 10)
              </Text>
            </div>

            <Switch
              label="Published"
              checked={blogForm.published}
              onChange={(e) =>
                setBlogForm({
                  ...blogForm,
                  published: e.currentTarget.checked,
                })
              }
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setEditBlogModalOpened(false);
                  setSelectedBlog(null);
                  resetBlogForm();
                }}
              >
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleUpdateBlog}
                loading={blogLoading}
              >
                Update Blog
              </Button>
            </Group>
          </div>
        </Modal>

        {/* Delete Blog Confirmation Modal */}
        <Modal
          opened={deleteBlogModalOpened}
          onClose={() => {
            setDeleteBlogModalOpened(false);
            setBlogToDelete(null);
          }}
          title={
            <Text fw={600} color="red">
              Delete Blog
            </Text>
          }
          centered
        >
          <div className="py-4">
            <Text size="sm" color="dimmed" mb="md">
              Are you sure you want to delete this blog? This action cannot be
              undone.
            </Text>
            {blogToDelete && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                {blogToDelete.image && (
                  <img
                    src={blogToDelete.image}
                    alt={blogToDelete.title}
                    className="w-20 h-14 rounded-lg object-cover"
                  />
                )}
                <div>
                  <Text size="sm" fw={500}>
                    {blogToDelete.title}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {blogToDelete.category}
                  </Text>
                </div>
              </div>
            )}
            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setDeleteBlogModalOpened(false);
                  setBlogToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={confirmDeleteBlog}
                loading={blogLoading}
              >
                Delete
              </Button>
            </Group>
          </div>
        </Modal>

        {/* AI Blog Generation Modal */}
        <Modal
          opened={aiGenerateModalOpened}
          onClose={() => {
            setAiGenerateModalOpened(false);
            resetAiMarketData();
          }}
          title={
            <Text fw={600} className="flex items-center gap-2">
              <span className="text-2xl">🤖</span> AI Blog Generator
            </Text>
          }
          size="lg"
          centered
        >
          <div className="space-y-4 py-2">
            <Text size="sm" color="dimmed" mb="md">
              Provide real estate market data to automatically generate SEO-optimized blog articles in both English and Turkish.
            </Text>

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="City (Şehir)"
                placeholder="e.g., İstanbul"
                required
                value={aiMarketData.city}
                onChange={(e) =>
                  setAiMarketData({ ...aiMarketData, city: e.target.value })
                }
              />

              <TextInput
                label="District (İlçe)"
                placeholder="e.g., Kadıköy"
                required
                value={aiMarketData.district}
                onChange={(e) =>
                  setAiMarketData({ ...aiMarketData, district: e.target.value })
                }
              />
            </div>

            <TextInput
              label="Neighborhood (Mahalle) - Optional"
              placeholder="e.g., Moda"
              value={aiMarketData.neighborhood}
              onChange={(e) =>
                setAiMarketData({ ...aiMarketData, neighborhood: e.target.value })
              }
            />

            <Divider label="Price Data (Optional)" />

            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Avg Sale Price per m² (TRY)"
                placeholder="e.g., 85000"
                hideControls
                value={aiMarketData.avgSalePrice}
                onChange={(value) =>
                  setAiMarketData({ ...aiMarketData, avgSalePrice: value })
                }
              />

              <NumberInput
                label="Avg Rental Price (TRY)"
                placeholder="e.g., 15000"
                hideControls
                value={aiMarketData.avgRentalPrice}
                onChange={(value) =>
                  setAiMarketData({ ...aiMarketData, avgRentalPrice: value })
                }
              />
            </div>

            <Divider label="Price Index Changes (Optional)" />

            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Monthly Change (%)"
                placeholder="e.g., 2.5"
                precision={2}
                value={aiMarketData.monthlyChange}
                onChange={(value) =>
                  setAiMarketData({ ...aiMarketData, monthlyChange: value })
                }
              />

              <NumberInput
                label="Yearly Change (%)"
                placeholder="e.g., 25.3"
                precision={2}
                value={aiMarketData.yearlyChange}
                onChange={(value) =>
                  setAiMarketData({ ...aiMarketData, yearlyChange: value })
                }
              />
            </div>

            <TextInput
              label="Demand Level (Talep Seviyesi)"
              placeholder="low / medium / high"
              value={aiMarketData.demandLevel}
              onChange={(e) =>
                setAiMarketData({ ...aiMarketData, demandLevel: e.target.value })
              }
            />

            <Switch
              label="Publish immediately after generation"
              checked={aiMarketData.autoPublish}
              onChange={(e) =>
                setAiMarketData({
                  ...aiMarketData,
                  autoPublish: e.currentTarget.checked,
                })
              }
            />

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4 border border-blue-100">
              <Text size="xs" color="dimmed">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌐</span>
                  <strong className="text-gray-700">Bilingual Content Generation</strong>
                </div>
                AI will generate 1200-1800 word SEO-optimized articles in <strong>English</strong> and <strong>Turkish</strong>:
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• 🇬🇧 Full English article with SEO optimization</li>
                  <li>• 🇹🇷 Full Turkish article with SEO optimization</li>
                  <li>• SEO-friendly titles and meta descriptions</li>
                  <li>• Market trend analysis & investment insights</li>
                  <li>• FAQ section (5 questions per language)</li>
                  <li>• Internal linking suggestions</li>
                </ul>
                <p className="mt-3 text-amber-600 font-medium">Generation may take 60-90 seconds due to bilingual content.</p>
              </Text>
            </div>

            <Group justify="flex-end" mt="xl">
              <Button
                variant="default"
                onClick={() => {
                  setAiGenerateModalOpened(false);
                  resetAiMarketData();
                }}
                disabled={aiGenerating}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: "indigo", to: "cyan" }}
                onClick={handleGenerateAIBlog}
                loading={aiGenerating}
                leftSection={!aiGenerating && <span>🤖</span>}
              >
                {aiGenerating ? "Generating..." : "Generate Blog"}
              </Button>
            </Group>
          </div>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminPanel;
