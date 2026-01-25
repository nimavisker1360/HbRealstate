import { NavLink, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
// icons
import {
  MdHomeWork,
  MdSell,
  MdKeyboardArrowDown,
  MdBusiness,
  MdLocationCity,
  MdPublic,
  MdLogout,
  MdFavorite,
  MdBookmarks,
  MdPerson,
} from "react-icons/md";
import { RiCheckboxMultipleBlankFill } from "react-icons/ri";
import { MdPermContactCalendar } from "react-icons/md";
import { MdAddHome } from "react-icons/md";
import { FaLandmark, FaHome, FaBriefcase } from "react-icons/fa";
import { Avatar } from "@mantine/core";
import useAdmin from "../hooks/useAdmin";
import useAuthCheck from "../hooks/useAuthCheck";
import userIcon from "../assets/user.svg";

const Navbar = ({ 
  containerStyles, 
  onContactClick, 
  closeMenu,
  isMobile = false,
  isAuthenticated = false,
  user = null,
  logout = null,
  isLoading = false,
  onLoginClick = null,
  onProfileClick = null,
}) => {
  const { t } = useTranslation();
  const { isAdmin, loading } = useAdmin();
  const { validateLogin } = useAuthCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [saleDropdownOpen, setSaleDropdownOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);

  // Property categories with translations
  const propertyCategories = [
    { value: "residential", label: t("categories.residential"), icon: FaHome },
    {
      value: "commercial",
      label: t("categories.commercial"),
      icon: FaBriefcase,
    },
    { value: "land", label: t("categories.land"), icon: FaLandmark },
  ];

  // Project types with translations
  const projectTypes = [
    {
      value: "LocalProject",
      label: t("nav.localProjects"),
      icon: MdLocationCity,
    },
    {
      value: "international",
      label: t("nav.internationalProjects"),
      icon: MdPublic,
    },
  ];

  const handleAddPropertyClick = () => {
    if (validateLogin()) {
      closeMenu && closeMenu();
      navigate("/admin");
    }
  };

  // Check if current filter is active
  const searchParams = new URLSearchParams(location.search);
  const currentFilter = searchParams.get("type");
  const currentCategory = searchParams.get("category");

  const handleCategoryClick = (type, category) => {
    navigate(`/listing?type=${type}&category=${category}`);
    setSaleDropdownOpen(false);
    setProjectsDropdownOpen(false);
    closeMenu && closeMenu();
  };

  const toggleSaleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaleDropdownOpen(!saleDropdownOpen);
    setProjectsDropdownOpen(false);
  };

  const toggleProjectsDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectsDropdownOpen(!projectsDropdownOpen);
    setSaleDropdownOpen(false);
  };

  const handleProjectClick = (projectType) => {
    if (projectType === "LocalProject") {
      navigate("/projects");
    } else {
      navigate(`/listing?projectType=${projectType}`);
    }
    setProjectsDropdownOpen(false);
    closeMenu && closeMenu();
  };

  return (
    <nav
      className={`${containerStyles} flex flex-col lg:flex-row lg:items-center`}
    >
      {/* Mobile Profile/Login Section - At Top */}
      {isMobile && (
        <div className="w-full mb-3 pb-3 border-b border-gray-200">
          {isLoading ? (
            <div className="px-3 py-2 text-gray-500 text-sm">{t('common.loading')}</div>
          ) : !isAuthenticated ? (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-3 w-full px-3 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src={userIcon} alt="" height={20} width={20} className="opacity-60" />
              <span className="text-gray-700 font-medium">{t('common.login')}</span>
            </button>
          ) : (
            <div className="space-y-1">
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar src={user?.picture} alt="user" radius="xl" size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-sm">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              
              {/* Menu Items */}
              <button
                onClick={onProfileClick}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50/50 rounded-lg transition-colors"
              >
                <MdPerson size={18} className="text-gray-400" />
                <span className="text-sm text-gray-700">{t('profile.myProfile')}</span>
              </button>
              
              <NavLink
                to="/favourites"
                onClick={() => closeMenu && closeMenu()}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50/50 rounded-lg transition-colors"
              >
                <MdFavorite size={18} className="text-gray-400" />
                <span className="text-sm text-gray-700">{t('profile.favourites')}</span>
              </NavLink>
              
              <NavLink
                to="/bookings"
                onClick={() => closeMenu && closeMenu()}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50/50 rounded-lg transition-colors"
              >
                <MdBookmarks size={18} className="text-gray-400" />
                <span className="text-sm text-gray-700">{t('profile.bookings')}</span>
              </NavLink>
              
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    localStorage.clear();
                    logout && logout();
                    closeMenu && closeMenu();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-red-50/50 rounded-lg transition-colors"
                >
                  <MdLogout size={18} className="text-red-500" />
                  <span className="text-sm text-red-500">{t('profile.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Home */}
      <NavLink
        to={"/"}
        onClick={() => closeMenu && closeMenu()}
        className={({ isActive }) =>
          `flex items-center justify-between w-full lg:w-auto px-4 py-4 lg:px-2 lg:py-1 border-b lg:border-b-0 border-gray-200 hover:bg-gray-50/30 lg:hover:bg-transparent transition-colors ${
            isActive
              ? "text-blue-600 font-semibold lg:active-link"
              : "text-gray-800"
          }`
        }
      >
        <div className="flex items-center gap-3">
          <MdHomeWork size={20} />
          <span>{t("nav.home")}</span>
        </div>
      </NavLink>

      {/* Listing */}
      <NavLink
        to={"/listing"}
        onClick={() => closeMenu && closeMenu()}
        className={({ isActive }) =>
          `flex items-center justify-between w-full lg:w-auto px-4 py-4 lg:px-2 lg:py-1 border-b lg:border-b-0 border-gray-200 hover:bg-gray-50/30 lg:hover:bg-transparent transition-colors ${
            isActive && !currentFilter
              ? "text-blue-600 font-semibold lg:active-link"
              : "text-gray-800"
          }`
        }
      >
        <div className="flex items-center gap-3">
          <RiCheckboxMultipleBlankFill size={20} />
          <span>{t("nav.listing")}</span>
        </div>
      </NavLink>

      {/* For Sale with Dropdown */}
      <div
        className="w-full lg:w-auto lg:relative lg:group"
        onMouseEnter={() =>
          window.innerWidth >= 1024 && setSaleDropdownOpen(true)
        }
        onMouseLeave={() =>
          window.innerWidth >= 1024 && setSaleDropdownOpen(false)
        }
      >
        <div
          className={`flex items-center justify-between w-full px-4 py-4 lg:px-3 lg:py-1 border-b lg:border-b-0 border-gray-200 cursor-pointer hover:bg-green-50/50 lg:hover:bg-transparent transition-colors ${
            currentFilter === "sale"
              ? "text-green-600 font-semibold lg:bg-green-500 lg:text-white"
              : "text-gray-800 lg:bg-green-100 lg:text-green-700 lg:hover:bg-green-500 lg:hover:text-white"
          }`}
          onClick={(e) => {
            // On mobile: toggle dropdown
            if (window.innerWidth < 1024) {
              toggleSaleDropdown(e);
            } else {
              // On desktop: navigate
              closeMenu && closeMenu();
              navigate("/listing?type=sale");
            }
          }}
        >
          <div className="flex items-center gap-3 lg:gap-1">
            <MdSell size={20} />
            <span>{t("nav.forSale")}</span>
          </div>
          <MdKeyboardArrowDown
            size={20}
            className={`transition-transform duration-300 ${
              saleDropdownOpen ? "rotate-180" : ""
            }`}
            onClick={(e) => {
              if (window.innerWidth < 1024) {
                toggleSaleDropdown(e);
              }
            }}
          />
        </div>

        {/* Sale Dropdown */}
        {saleDropdownOpen && (
          <div className="lg:absolute lg:top-full lg:left-0 lg:z-50 bg-white lg:shadow-lg lg:border lg:border-gray-100">
            {propertyCategories.map((cat) => {
              const IconComponent = cat.icon;
              const isActive =
                currentFilter === "sale" && currentCategory === cat.value;
              return (
                <div
                  key={cat.value}
                  onClick={() => handleCategoryClick("sale", cat.value)}
                  className={`flex items-start gap-3 px-8 lg:px-4 py-3 lg:py-2 cursor-pointer transition-colors border-b lg:border-b-0 border-gray-200 last:border-b-0 ${
                    isActive
                      ? "bg-green-100 text-green-700 font-medium lg:bg-green-500 lg:text-white"
                      : "text-green-700 hover:bg-green-50/50 lg:hover:bg-green-50 lg:hover:text-green-600"
                  }`}
                >
                  <IconComponent size={18} />
                  <span className="text-sm lg:text-sm font-medium">
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects with Dropdown */}
      <div
        className="w-full lg:w-auto lg:relative lg:group"
        onMouseEnter={() =>
          window.innerWidth >= 1024 && setProjectsDropdownOpen(true)
        }
        onMouseLeave={() =>
          window.innerWidth >= 1024 && setProjectsDropdownOpen(false)
        }
      >
        <div
          className={`flex items-center justify-between w-full px-4 py-4 lg:px-3 lg:py-1 border-b lg:border-b-0 border-gray-200 cursor-pointer hover:bg-blue-50/50 lg:hover:bg-transparent transition-colors ${
            searchParams.get("projectType")
              ? "text-blue-600 font-semibold lg:bg-blue-500 lg:text-white"
              : "text-gray-800 lg:bg-blue-100 lg:text-blue-700 lg:hover:bg-blue-500 lg:hover:text-white"
          }`}
          onClick={(e) => {
            // On mobile: toggle dropdown
            if (window.innerWidth < 1024) {
              toggleProjectsDropdown(e);
            } else {
              // On desktop: toggle dropdown instead of navigate
              toggleProjectsDropdown(e);
            }
          }}
        >
          <div className="flex items-center gap-3 lg:gap-1">
            <MdBusiness size={20} />
            <span>{t("nav.projects")}</span>
          </div>
          <MdKeyboardArrowDown
            size={20}
            className={`transition-transform duration-300 ${
              projectsDropdownOpen ? "rotate-180" : ""
            }`}
            onClick={(e) => {
              toggleProjectsDropdown(e);
            }}
          />
        </div>

        {/* Projects Dropdown */}
        {projectsDropdownOpen && (
          <div className="lg:absolute lg:top-full lg:left-0 lg:z-50 bg-blue-50 lg:bg-white lg:shadow-lg lg:border lg:border-gray-100 lg:min-w-[200px]">
            {projectTypes.map((project) => {
              const IconComponent = project.icon;
              const isActive =
                searchParams.get("projectType") === project.value;
              return (
                <div
                  key={project.value}
                  onClick={() => handleProjectClick(project.value)}
                  className={`flex items-center gap-3 px-8 lg:px-4 py-3 lg:py-2 cursor-pointer transition-colors border-b lg:border-b-0 border-gray-200 last:border-b-0 ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium lg:bg-blue-500 lg:text-white"
                      : "text-blue-700 hover:bg-blue-50/50 lg:hover:bg-blue-50 lg:hover:text-blue-600"
                  }`}
                >
                  <IconComponent size={18} />
                  <span className="text-sm lg:text-sm font-medium whitespace-nowrap">
                    {project.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact */}
      <button
        onClick={onContactClick}
        className="flex items-center justify-between w-full lg:w-auto px-4 py-4 lg:px-2 lg:py-1 border-b lg:border-b-0 border-gray-200 hover:bg-gray-50/30 lg:hover:bg-transparent lg:hover:text-secondary transition-colors text-gray-800"
      >
        <div className="flex items-center gap-3">
          <MdPermContactCalendar size={20} />
          <span>{t("nav.contact")}</span>
        </div>
      </button>

      {/* Add Property - Admin Only */}
      {!loading && isAdmin && (
        <div
          onClick={handleAddPropertyClick}
          className="flex items-center justify-between w-full lg:w-auto px-4 py-4 lg:px-2 lg:py-1 border-b lg:border-b-0 border-gray-200 cursor-pointer hover:bg-gray-50/30 lg:hover:bg-secondary lg:hover:text-white transition-colors text-gray-800"
        >
          <div className="flex items-center gap-3">
            <MdAddHome size={20} />
            <span>{t("nav.addProperty")}</span>
          </div>
        </div>
      )}

          </nav>
  );
};

Navbar.propTypes = {
  containerStyles: PropTypes.string,
  onContactClick: PropTypes.func,
  closeMenu: PropTypes.func,
  isMobile: PropTypes.bool,
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object,
  logout: PropTypes.func,
  isLoading: PropTypes.bool,
  onLoginClick: PropTypes.func,
  onProfileClick: PropTypes.func,
};

export default Navbar;
