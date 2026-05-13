import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"
import { lazy, Suspense, useState, useEffect } from "react";
import UserDetailContext from "./context/UserDetailContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import ScrollToTop from "./components/ScrollToTop";
import RouteSeo from "./components/RouteSeo";
import Home from "./pages/seo/HomeSeoPage";
import { contentHubPages } from "./data/contentHubPages";
import {
  DEFAULT_LANGUAGE_CODE,
  extractLanguageFromPath,
} from "./utils/languageRouting";
import LegacyServicesRedirect from "./components/LegacyServicesRedirect";

const Listing = lazy(() => import("./pages/seo/ListingSeoPage"));
const Property = lazy(() => import("./pages/seo/PropertySeoPage"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const PropertyReelsAgentsAdmin = lazy(() =>
  import("./pages/PropertyReelsAgentsAdmin")
);
const Consultants = lazy(() => import("./pages/Consultants"));
const TodayProperties = lazy(() => import("./pages/TodayProperties"));
const CitizenshipLanding = lazy(() => import("./pages/CitizenshipLanding"));
const MyStagingRequests = lazy(() => import("./pages/MyStagingRequests"));
const BlogsPage = lazy(() => import("./pages/Blogs"));
const CountryBlogs = lazy(() => import("./pages/CountryBlogs"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Addresses = lazy(() => import("./pages/Addresses"));
const LocalProjects = lazy(() => import("./pages/LocalProjects"));
const ProjectDetail = lazy(() => import("./pages/seo/ProjectDetailSeoPage"));
const TestimonialsTest = lazy(() => import("./pages/TestimonialsTest"));
const Favourites = lazy(() => import("./pages/Favourites"));
const Bookings = lazy(() => import("./pages/Bookings"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const InvestmentGuides = lazy(() => import("./pages/InvestmentGuides"));
const InvestmentOpportunitiesBlogs = lazy(
  () => import("./pages/InvestmentOpportunitiesBlogs")
);
const ServicesHubPage = lazy(() => import("./pages/services/ServicesHubPage"));
const PropertyInspectionLanding = lazy(
  () => import("./pages/services/PropertyInspectionLanding")
);
const PropertyInspectionRequestPage = lazy(
  () => import("./pages/services/PropertyInspectionRequestPage")
);
const PropertyInspectionSampleReportPage = lazy(
  () => import("./pages/services/PropertyInspectionSampleReportPage")
);
const PropertyInspectionFaqPage = lazy(
  () => import("./pages/services/PropertyInspectionFaqPage")
);
const HomeStagingLanding = lazy(() => import("./pages/services/HomeStagingLanding"));
const HomeStagingRequestPage = lazy(
  () => import("./pages/services/HomeStagingRequestPage")
);
const HomeStagingProjectsPage = lazy(
  () => import("./pages/services/HomeStagingProjectsPage")
);
const HomeStagingProjectDetailPage = lazy(
  () => import("./pages/services/HomeStagingProjectDetailPage")
);
const HomeStagingFaqPage = lazy(() => import("./pages/services/HomeStagingFaqPage"));
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("react-query/devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : () => null;

const LegacyBrowseRedirect = () => {
  const { search, hash } = useLocation();
  return <Navigate to={`/listing${search}${hash}`} replace />;
};

export default function App() {
  const getPathLanguage = () =>
    extractLanguageFromPath(window.location.pathname) || DEFAULT_LANGUAGE_CODE;
  const [routerLanguage, setRouterLanguage] = useState(getPathLanguage);
  const routerBasename = `/${routerLanguage}`;

  const [queryClient] = useState(() => new QueryClient());
  const [userDetails, setUserDetails] = useState({
    favourites: [],
    bookings: [],
    token: null
  })

  // Scroll to top on initial load and disable browser scroll restoration
  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const syncRouterLanguage = () => {
      const nextLanguage = getPathLanguage();
      setRouterLanguage((prevLanguage) =>
        prevLanguage === nextLanguage ? prevLanguage : nextLanguage
      );
    };

    window.addEventListener("popstate", syncRouterLanguage);
    window.addEventListener("app:language-path-change", syncRouterLanguage);

    return () => {
      window.removeEventListener("popstate", syncRouterLanguage);
      window.removeEventListener("app:language-path-change", syncRouterLanguage);
    };
  }, []);

  return (
    <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
      <CurrencyProvider>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter key={routerLanguage} basename={routerBasename}>
              <ScrollToTop />
              <RouteSeo />
              <Suspense fallback={null}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Home />} />
                    <Route path="/contact" element={<Addresses variant="contact" />} />
                    <Route path="/browse" element={<LegacyBrowseRedirect />} />
                    <Route path="/services">
                      <Route index element={<ServicesHubPage />} />
                      <Route
                        path="property-inspection"
                        element={<PropertyInspectionLanding />}
                      />
                      <Route
                        path="property-inspection/request"
                        element={<PropertyInspectionRequestPage />}
                      />
                      <Route
                        path="property-inspection/sample-report"
                        element={<PropertyInspectionSampleReportPage />}
                      />
                      <Route
                        path="property-inspection/faq"
                        element={<PropertyInspectionFaqPage />}
                      />
                      <Route
                        path="home-staging"
                        element={<HomeStagingLanding />}
                      />
                      <Route
                        path="home-staging/request"
                        element={<HomeStagingRequestPage />}
                      />
                      <Route
                        path="home-staging/projects"
                        element={<HomeStagingProjectsPage />}
                      />
                      <Route
                        path="home-staging/projects/:projectId"
                        element={<HomeStagingProjectDetailPage />}
                      />
                      <Route
                        path="home-staging/faq"
                        element={<HomeStagingFaqPage />}
                      />
                    </Route>
                    <Route path="/listing">
                      <Route index element={<Listing />} />
                      <Route path="property-inspection" element={<LegacyServicesRedirect />} />
                      <Route path="property-inspection/*" element={<LegacyServicesRedirect />} />
                      <Route path="home-staging" element={<LegacyServicesRedirect />} />
                      <Route path="home-staging/*" element={<LegacyServicesRedirect />} />
                      <Route path=":propertyId" element={<Property />} />
                    </Route>
                    <Route
                      path="/addproperty"
                      element={
                        <RequireAuth>
                          <AddProperty />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <RequireAuth>
                          <AdminPanel />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin/property-reels-agents"
                      element={
                        <RequireAuth>
                          <PropertyReelsAgentsAdmin />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/bookings"
                      element={
                        <RequireAuth>
                          <Bookings />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/favourites"
                      element={
                        <RequireAuth>
                          <Favourites />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/my-staging-requests"
                      element={
                        <RequireAuth>
                          <MyStagingRequests />
                        </RequireAuth>
                      }
                    />
                    <Route path="/consultants" element={<Consultants />} />
                    <Route path="/citizenship" element={<CitizenshipLanding />} />
                    <Route path="/today" element={<TodayProperties />} />
                    <Route path="/blogs" element={<BlogsPage />} />
                    <Route path="/blogs/:countrySlug" element={<CountryBlogs />} />
                    <Route path="/blogs/category/:categorySlug" element={<BlogCategory />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/testimonials-test" element={<TestimonialsTest />} />
                    <Route path="/addresses" element={<Addresses />} />
                    <Route path="/projects" element={<LocalProjects />} />
                    <Route path="/projects/:projectSlugOrId" element={<ProjectDetail />} />
                    <Route path="/investment-guides" element={<InvestmentGuides />} />
                    {contentHubPages.map((guide) => (
                      <Route
                        key={guide.slug}
                        path={`/${guide.slug}`}
                        element={<GuidePage slug={guide.slug} />}
                      />
                    ))}
                    <Route
                      path="/investment-opportunities"
                      element={<InvestmentOpportunitiesBlogs />}
                    />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          <ToastContainer />
          {import.meta.env.DEV && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </QueryClientProvider>
      </CurrencyProvider>
    </UserDetailContext.Provider>
  )
}
