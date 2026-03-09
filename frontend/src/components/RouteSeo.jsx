import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import SEO from "./SEO";

const NOINDEX_PREFIXES = [
  "/admin",
  "/addproperty",
  "/bookings",
  "/favourites",
  "/testimonials-test",
];

const RouteSeo = () => {
  const location = useLocation();
  const pathname = location.pathname || "/";

  const config = useMemo(() => {
    const isNoIndex = NOINDEX_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isNoIndex) {
      return {
        title: "HB International Real Estate",
        description:
          "Internal dashboard page for HB International Real Estate.",
        canonicalPath: pathname,
        noindex: true,
      };
    }

    const hasDedicatedSeo =
      pathname === "/" ||
      pathname === "/listing" ||
      pathname.startsWith("/listing/") ||
      pathname.startsWith("/projects/") ||
      pathname === "/blogs" ||
      pathname.startsWith("/blogs/") ||
      pathname.startsWith("/blog/") ||
      pathname === "/istanbul-apartments" ||
      pathname === "/kyrenia-apartments" ||
      pathname === "/investment-opportunities" ||
      pathname === "/turkey-property-investment" ||
      pathname === "/turkish-citizenship-property";

    if (hasDedicatedSeo) {
      return null;
    }

    if (pathname === "/projects") {
      return {
        title: "Real Estate Projects | HB International Real Estate",
        description:
          "Discover curated local and international real estate projects with pricing and availability details.",
        canonicalPath: "/projects",
      };
    }

    if (pathname.startsWith("/projects/")) {
      return {
        title: "Project Detail | HB International Real Estate",
        description:
          "Review project details, amenities, location insights, and contact options.",
        canonicalPath: pathname,
      };
    }

    if (pathname === "/consultants") {
      return {
        title: "Real Estate Consultants | HB International Real Estate",
        description:
          "Connect with multilingual real estate consultants for investment planning and property support.",
        canonicalPath: "/consultants",
      };
    }

    if (pathname === "/contact") {
      return {
        title: "Contact Us | HB International Real Estate",
        description:
          "Send a message to HB International Real Estate and connect with our consultants for property support.",
        canonicalPath: "/contact",
      };
    }

    if (pathname === "/addresses") {
      return {
        title: "Our Office Addresses | HB International Real Estate",
        description:
          "Find office addresses and contact points for HB International Real Estate.",
        canonicalPath: "/addresses",
      };
    }

    if (pathname === "/today") {
      return {
        title: "Today's Price List | HB International Real Estate",
        description:
          "Track current property pricing updates and featured opportunities from HB International Real Estate.",
        canonicalPath: "/today",
      };
    }

    return {
      canonicalPath: pathname,
    };
  }, [pathname]);

  if (!config) return null;
  return <SEO {...config} />;
};

export default RouteSeo;
