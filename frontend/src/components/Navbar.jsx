import { NavLink, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
// icons
import {
  MdHomeWork,
  MdSell,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
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
  const [aboutTurkeyDropdownOpen, setAboutTurkeyDropdownOpen] = useState(false);
  const aboutTurkeyCloseTimer = useRef(null);
  const isDesktop = !isMobile;
  const desktopItemClass = (isActive = false) =>
    `flex items-center gap-1 px-2 py-1 text-[13px] font-semibold ${
      isActive ? "text-secondaryRed" : "text-gray-800"
    } hover:text-secondary transition-colors`;
  const mobileItemClass = (isActive = false) =>
    `flex items-center justify-between w-full px-4 py-4 border-b border-gray-200 hover:bg-gray-50/30 transition-colors ${
      isActive ? "text-secondaryRed font-semibold" : "text-gray-800"
    }`;
  const linkClass = (isActive = false) =>
    isMobile ? mobileItemClass(isActive) : desktopItemClass(isActive);
  const simpleButtonClass = (isActive = false) =>
    isMobile ? mobileItemClass(isActive) : desktopItemClass(isActive);

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

  const aboutTurkeyMenu = [
    {
      titleKey: "aboutTurkeyMenu.mediterraneanRegion",
      items: [
        { labelKey: "aboutTurkeyMenu.livingInAntalyaProsConsCost" },
        { labelKey: "aboutTurkeyMenu.propertyInvestmentAntalyaGuide2026" },
        { labelKey: "aboutTurkeyMenu.bestAreasBuyPropertyAlanya" },
        { labelKey: "aboutTurkeyMenu.sideRealEstateMarketOverview" },
        { labelKey: "aboutTurkeyMenu.belekGolfTourismLuxuryInvestment" },
        { labelKey: "aboutTurkeyMenu.kemerLifestyleGuideForeigners" },
        { labelKey: "aboutTurkeyMenu.costOfLivingMediterraneanTurkey" },
        { labelKey: "aboutTurkeyMenu.whyMediterraneanCoastIdealInvestors" },
      ],
    },
    {
      titleKey: "aboutTurkeyMenu.aegeanRegion",
      items: [
        { labelKey: "aboutTurkeyMenu.livingInIstanbulDistrictGuide" },
        { labelKey: "aboutTurkeyMenu.bestAreasBuyPropertyIstanbul2026" },
        { labelKey: "aboutTurkeyMenu.istanbulRealEstateMarketForecast" },
        { labelKey: "aboutTurkeyMenu.bursaAffordableAlternativeIstanbul" },
        { labelKey: "aboutTurkeyMenu.yalovaPropertyInvestmentGuide" },
        { labelKey: "aboutTurkeyMenu.costOfLivingMarmaraRegion" },
        { labelKey: "aboutTurkeyMenu.istanbulVsAnkaraVsIzmirWhereInvest" },
        { labelKey: "aboutTurkeyMenu.whyMarmaraEconomicHeart" },
      ],
    },
    {
      titleKey: "aboutTurkeyMenu.marmaraRegion",
      items: [
        { labelKey: "aboutTurkeyMenu.livingInIstanbulDistrictGuide" },
        { labelKey: "aboutTurkeyMenu.bestAreasBuyPropertyIstanbul2026" },
        { labelKey: "aboutTurkeyMenu.istanbulRealEstateMarketForecast" },
        { labelKey: "aboutTurkeyMenu.bursaAffordableAlternativeIstanbul" },
        { labelKey: "aboutTurkeyMenu.yalovaPropertyInvestmentGuide" },
        { labelKey: "aboutTurkeyMenu.costOfLivingMarmaraRegion" },
        { labelKey: "aboutTurkeyMenu.istanbulVsAnkaraVsIzmirWhereInvest" },
        { labelKey: "aboutTurkeyMenu.whyMarmaraEconomicHeart" },
      ],
    },
    {
      titleKey: "aboutTurkeyMenu.lycianCoast",
      items: [
        { labelKey: "aboutTurkeyMenu.lycianCoastLifestyleGuide" },
        { labelKey: "aboutTurkeyMenu.whyForeignersLoveLycianWay" },
        { labelKey: "aboutTurkeyMenu.bestCoastalTownsLycianCoast" },
        { labelKey: "aboutTurkeyMenu.fethiyeKasInvestmentComparison" },
        { labelKey: "aboutTurkeyMenu.livingInKasHiddenGemExpats" },
        { labelKey: "aboutTurkeyMenu.ecoTourismRealEstateLycianCoast" },
        { labelKey: "aboutTurkeyMenu.longTermRentalPotentialLycianRegion" },
      ],
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

  const openAboutTurkeyMenu = () => {
    if (aboutTurkeyCloseTimer.current) {
      clearTimeout(aboutTurkeyCloseTimer.current);
      aboutTurkeyCloseTimer.current = null;
    }
    setAboutTurkeyDropdownOpen(true);
  };

  const scheduleCloseAboutTurkeyMenu = () => {
    if (aboutTurkeyCloseTimer.current) {
      clearTimeout(aboutTurkeyCloseTimer.current);
    }
    aboutTurkeyCloseTimer.current = setTimeout(() => {
      setAboutTurkeyDropdownOpen(false);
      aboutTurkeyCloseTimer.current = null;
    }, 180);
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
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg bg-[#00A86B] text-white hover:bg-[#009A61] transition-colors"
            >
              <img
                src={userIcon}
                alt=""
                height={20}
                width={20}
                className="brightness-0 invert"
              />
              <span className="font-medium">{t('common.login')}</span>
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
        className={({ isActive }) => linkClass(isActive)}
      >
        <div className="flex items-center gap-3">
          <MdHomeWork
            size={20}
            className={isMobile ? "" : "text-secondaryRed"}
          />
          <span>{t("nav.home")}</span>
        </div>
      </NavLink>

      {/* Listing */}
      <NavLink
        to={"/listing"}
        onClick={() => closeMenu && closeMenu()}
        className={({ isActive }) => linkClass(isActive && !currentFilter)}
      >
        <div className="flex items-center gap-3">
          <RiCheckboxMultipleBlankFill
            size={20}
            className={isMobile ? "" : "lg:hidden"}
          />
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
          className={`${linkClass(currentFilter === "sale")} cursor-pointer`}
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
            <MdSell size={20} className={isMobile ? "" : "lg:hidden"} />
            <span>{t("nav.forSale")}</span>
          </div>
          <MdKeyboardArrowDown
            size={20}
            className={`transition-transform duration-300 text-gray-500 ${
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
          <div className="lg:absolute lg:top-full lg:left-0 lg:z-50 bg-white lg:shadow-xl lg:border lg:border-gray-200 lg:rounded-lg lg:overflow-hidden lg:min-w-[210px]">
            {propertyCategories.map((cat) => {
              const IconComponent = cat.icon;
              const isActive =
                currentFilter === "sale" && currentCategory === cat.value;
              return (
                <div
                  key={cat.value}
                  onClick={() => handleCategoryClick("sale", cat.value)}
                  className={`group flex items-center gap-3 px-8 lg:px-4 py-3 lg:py-2 cursor-pointer transition-colors border-b lg:border-b-0 border-gray-100 last:border-b-0 ${
                    isActive
                      ? "bg-secondary/15 text-secondary font-semibold"
                      : "text-gray-700 hover:bg-[#00A86B] hover:text-white"
                  }`}
                >
                  <IconComponent
                    size={18}
                    className="text-gray-500 group-hover:text-white"
                  />
                  <span className="text-sm lg:text-sm font-medium">
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button type="button" className={simpleButtonClass(false)}>
        <span>{t("nav.citizenship")}</span>
      </button>

      {isDesktop ? (
        <div
          className="relative"
          onMouseEnter={() => window.innerWidth >= 1024 && openAboutTurkeyMenu()}
          onMouseLeave={() =>
            window.innerWidth >= 1024 && scheduleCloseAboutTurkeyMenu()
          }
        >
          <button
            type="button"
            className={simpleButtonClass(false)}
            aria-expanded={aboutTurkeyDropdownOpen}
            onClick={(e) => {
              e.preventDefault();
              if (window.innerWidth < 1024) return;
              if (aboutTurkeyDropdownOpen) {
                scheduleCloseAboutTurkeyMenu();
              } else {
                openAboutTurkeyMenu();
              }
            }}
          >
            <span>{t("nav.aboutTurkey")}</span>
            <MdKeyboardArrowDown size={16} className="text-gray-500" />
          </button>

          {aboutTurkeyDropdownOpen && (
            <div className="absolute top-full left-1/2 z-50 w-[min(1100px,92vw)] -translate-x-1/2 pt-3">
              <div className="rounded-2xl border border-black/10 bg-[#e7e2d4] p-6 shadow-xl">
                <div className="grid grid-cols-4 gap-6">
                  {aboutTurkeyMenu.map((column) => (
                    <div key={column.title} className="min-w-0">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">
                        {t(column.titleKey)}
                      </h4>
                      <div className="mt-2 h-0.5 w-10 bg-red-500"></div>
                    </div>
                    <ul className="space-y-2">
                      {column.items.map((item) => (
                        <li key={item.labelKey}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-[#00A86B] hover:text-white"
                            >
                            <span>{t(item.labelKey)}</span>
                            {item.hasChildren && (
                              <MdKeyboardArrowRight
                                size={18}
                                className="text-gray-500"
                                />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button type="button" className={simpleButtonClass(false)}>
          <span>{t("nav.aboutTurkey")}</span>
        </button>
      )}

      <button type="button" className={simpleButtonClass(false)}>
        <span>{t("nav.buyerGuide")}</span>
        <MdKeyboardArrowDown
          size={isMobile ? 20 : 16}
          className="text-gray-500"
        />
      </button>

      <button type="button" className={simpleButtonClass(false)}>
        <span>{t("nav.aboutUs")}</span>
        <MdKeyboardArrowDown
          size={isMobile ? 20 : 16}
          className="text-gray-500"
        />
      </button>

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
          className={`${linkClass(Boolean(searchParams.get("projectType")))} cursor-pointer`}
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
            <MdBusiness size={20} className={isMobile ? "" : "lg:hidden"} />
            <span>{t("nav.projects")}</span>
          </div>
          <MdKeyboardArrowDown
            size={20}
            className={`transition-transform duration-300 text-gray-500 ${
              projectsDropdownOpen ? "rotate-180" : ""
            }`}
            onClick={(e) => {
              toggleProjectsDropdown(e);
            }}
          />
        </div>

        {/* Projects Dropdown */}
        {projectsDropdownOpen && (
          <div className="lg:absolute lg:top-full lg:left-0 lg:z-50 bg-white lg:shadow-xl lg:border lg:border-gray-200 lg:rounded-lg lg:overflow-hidden lg:min-w-[210px]">
            {projectTypes.map((project) => {
              const IconComponent = project.icon;
              const isActive =
                searchParams.get("projectType") === project.value;
              return (
                <div
                  key={project.value}
                  onClick={() => handleProjectClick(project.value)}
                  className={`group flex items-center gap-3 px-8 lg:px-4 py-3 lg:py-2 cursor-pointer transition-colors border-b lg:border-b-0 border-gray-100 last:border-b-0 ${
                    isActive
                      ? "bg-secondary/15 text-secondary font-semibold"
                      : "text-gray-700 hover:bg-[#00A86B] hover:text-white"
                  }`}
                >
                  <IconComponent
                    size={18}
                    className="text-gray-500 group-hover:text-white"
                  />
                  <span className="text-sm lg:text-sm font-medium whitespace-nowrap">
                    {project.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Property - Admin Only */}
      {!loading && isAdmin && (
        <div
          onClick={handleAddPropertyClick}
          className={`${linkClass(false)} cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            <MdAddHome size={20} className={isMobile ? "" : "lg:hidden"} />
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
