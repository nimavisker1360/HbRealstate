import { useState, useEffect, useRef, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useProperties from "../hooks/useProperties";
import { PuffLoader } from "react-spinners";
import PropertyCard from "../components/PropertyCard";
import PropertiesMap from "../components/PropertiesMap";
import { 
  MdSell, 
  MdList, 
  MdSearch, 
  MdClose,
  MdFilterList,
  MdKeyboardArrowDown,
  MdLocationOn
} from "react-icons/md";
import { FaLandmark, FaHome, FaBriefcase, FaHotel, FaUmbrellaBeach, FaCity } from "react-icons/fa";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { BsBuildingsFill } from "react-icons/bs";
import CurrencyContext from "../context/CurrencyContext";

const Listing = () => {
  const { t, i18n } = useTranslation();
  const { data, isError, isLoading } = useProperties();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);
  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;

  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
  const [showAllFiltersModal, setShowAllFiltersModal] = useState(false);
  const [mobileView, setMobileView] = useState("list");

  // Refs for closing dropdowns on outside click
  const typeRef = useRef(null);
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const roomsRef = useRef(null);

  // Room count options
  const roomOptions = [
    { value: "0", label: t('listing.studio') },
    { value: "1", label: t('listing.room1') },
    { value: "2", label: t('listing.room2') },
    { value: "3", label: t('listing.room3') },
    { value: "4", label: t('listing.room4') },
    { value: "5+", label: t('listing.room5plus') },
  ];

  // Property categories with translations (projects have their own dedicated pages)
  const propertyCategories = [
    { value: "residential", label: t('categories.residential'), icon: FaHome },
    { value: "villa", label: t('categories.villa'), icon: FaHome },
    { value: "commercial", label: t('categories.commercial'), icon: FaBriefcase },
    { value: "land", label: t('categories.land'), icon: FaLandmark },
    { value: "residentialProjects", label: t('categories.residentialProjects'), icon: FaCity },
    { value: "building", label: t('categories.building'), icon: BsBuildingsFill },
    { value: "timeshare", label: t('categories.timeshare'), icon: FaHotel },
    { value: "touristFacility", label: t('categories.touristFacility'), icon: FaUmbrellaBeach },
  ];

  // Property types (projects have their own dedicated pages)
  const propertyTypes = [
    { value: null, label: t('listing.all'), icon: MdList },
    { value: "sale", label: t('listing.forSale'), icon: MdSell, color: "green" },
  ];

  // Get filters from URL
  const typeFilter = searchParams.get("type");
  const projectTypeFilter = searchParams.get("projectType");
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const roomsFilter = searchParams.get("rooms") || "";

  // Local state for price inputs
  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });

  // Map projectType to type filter (for navbar compatibility)
  const effectiveTypeFilter = projectTypeFilter 
    ? (projectTypeFilter === "LocalProject" ? "local-project" : "international-project")
    : typeFilter;

  const [filter, setFilter] = useState(searchQuery);

  // Update filter when URL search param changes
  useEffect(() => {
    setFilter(searchQuery);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (priceRef.current && !priceRef.current.contains(event.target)) {
        setShowPriceDropdown(false);
      }
      if (roomsRef.current && !roomsRef.current.contains(event.target)) {
        setShowRoomsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update URL when filter changes
  const handleFilterChange = (value) => {
    setFilter(value);
    if (value.trim()) {
      searchParams.set("search", value);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
  };

  const handleTypeFilter = (type) => {
    searchParams.delete("projectType");
    if (type === null) {
      searchParams.delete("type");
      searchParams.delete("category");
    } else {
      searchParams.set("type", type);
    }
    setSearchParams(searchParams);
    setShowTypeDropdown(false);
  };

  const handleCategoryFilter = (category) => {
    if (category === null) {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
    setShowCategoryDropdown(false);
  };

  const handlePriceFilter = () => {
    if (priceRange.min) {
      searchParams.set("minPrice", priceRange.min);
    } else {
      searchParams.delete("minPrice");
    }
    if (priceRange.max) {
      searchParams.set("maxPrice", priceRange.max);
    } else {
      searchParams.delete("maxPrice");
    }
    setSearchParams(searchParams);
    setShowPriceDropdown(false);
  };

  const handleRoomsFilter = (rooms) => {
    if (rooms) {
      searchParams.set("rooms", rooms);
    } else {
      searchParams.delete("rooms");
    }
    setSearchParams(searchParams);
    setShowRoomsDropdown(false);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setFilter("");
    setPriceRange({ min: "", max: "" });
  };

  const handleResetFilters = () => {
    clearAllFilters();
    setShowAllFiltersModal(false);
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (effectiveTypeFilter) count++;
    if (categoryFilter) count++;
    if (minPrice || maxPrice) count++;
    if (roomsFilter) count++;
    if (filter) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  if (isError) {
    return (
      <div className="h-screen flexCenter">
        <span className="text-red-500">{t('listing.errorFetching')}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flexCenter">
        <PuffLoader
          height="80"
          width="80"
          radius={1}
          color="#16a34a"
          aria-label="puff-loading"
        />
      </div>
    );
  }

  // Filter properties
  const filteredData = data
    .filter((property) => {
      if (effectiveTypeFilter) {
        return property.propertyType === effectiveTypeFilter;
      }
      // When no type filter is selected, exclude projects (they have their own pages)
      return property.propertyType !== "local-project" && property.propertyType !== "international-project";
    })
    .filter((property) => {
      if (categoryFilter) {
        return property.category === categoryFilter;
      }
      return true;
    })
    .filter((property) => {
      if (!minPrice && !maxPrice) return true;
      const priceValue = convertAmount(
        property.price || 0,
        property.currency || baseCurrency,
        displayCurrency
      );
      if (minPrice && priceValue < parseInt(minPrice)) return false;
      if (maxPrice && priceValue > parseInt(maxPrice)) return false;
      return true;
    })
    .filter((property) => {
      if (roomsFilter) {
        // Check rooms string field (Turkish format like "2+1", "3+1")
        if (property.rooms) {
          const roomMatch = property.rooms.match(/^(\d+)/);
          const roomCount = roomMatch ? parseInt(roomMatch[1]) : 0;
          
          if (roomsFilter === "0") {
            // Studio - check if rooms contains "Stüdyo" or bedrooms is 0
            return property.rooms.toLowerCase().includes("stüdyo") || 
                   property.rooms.toLowerCase().includes("studio") ||
                   roomCount === 0;
          }
          if (roomsFilter === "5+") {
            return roomCount >= 5;
          }
          return roomCount === parseInt(roomsFilter);
        }
        
        // Fallback to facilities.bedrooms for older data
        const bedrooms = property.facilities?.bedrooms || 0;
        if (roomsFilter === "0") {
          return bedrooms === 0;
        }
        if (roomsFilter === "5+") {
          return bedrooms >= 5;
        }
        return bedrooms === parseInt(roomsFilter);
      }
      return true;
    })
    .filter(
      (property) =>
        property.title.toLowerCase().includes(filter.toLowerCase()) ||
        property.city.toLowerCase().includes(filter.toLowerCase()) ||
        property.country.toLowerCase().includes(filter.toLowerCase()) ||
        property.address.toLowerCase().includes(filter.toLowerCase())
    );

  const handlePropertyClick = (id) => {
    navigate(`/listing/${id}`);
  };

  // Get current type label
  const getCurrentTypeLabel = () => {
    const current = propertyTypes.find(t => t.value === effectiveTypeFilter);
    return current ? current.label : t('listing.forSale');
  };

  // Get current category label
  const getCurrentCategoryLabel = () => {
    if (!categoryFilter) return t('listing.propertyUses');
    const current = propertyCategories.find(c => c.value === categoryFilter);
    return current ? current.label : t('listing.propertyUses');
  };

  // Get price label
  const getPriceLabel = () => {
    if (minPrice || maxPrice) {
      if (minPrice && maxPrice)
        return `${formatMoney(
          Number(minPrice),
          displayCurrency,
          i18n.language === "tr" ? "tr-TR" : "en-US"
        )} - ${formatMoney(
          Number(maxPrice),
          displayCurrency,
          i18n.language === "tr" ? "tr-TR" : "en-US"
        )}`;
      if (minPrice)
        return `${formatMoney(
          Number(minPrice),
          displayCurrency,
          i18n.language === "tr" ? "tr-TR" : "en-US"
        )}+`;
      if (maxPrice)
        return `${t('listing.maxPrice')}: ${formatMoney(
          Number(maxPrice),
          displayCurrency,
          i18n.language === "tr" ? "tr-TR" : "en-US"
        )}`;
    }
    return t('listing.price');
  };

  // Get rooms label
  const getRoomsLabel = () => {
    if (roomsFilter) {
      const option = roomOptions.find(o => o.value === roomsFilter);
      return option ? option.label : t('listing.rooms');
    }
    return t('listing.rooms');
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-white border-b shadow-sm z-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col gap-2 py-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-2 lg:max-w-[60%] lg:py-4">
            {/* Search Row */}
            <div className="flex items-center gap-2 w-full order-1 lg:order-1 lg:flex-none lg:w-[420px]">
              <div className="flex items-center gap-2 w-full h-11 bg-white border border-gray-300 rounded-xl px-3 py-2.5 lg:px-3 lg:py-2.5 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
                <MdLocationOn className="text-gray-400 text-lg flex-shrink-0" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  placeholder={t('listing.locationPlaceholder')}
                  className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                />
                {filter && (
                  <button 
                    onClick={() => handleFilterChange("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={16} />
                  </button>
                )}
                <MdSearch className="text-gray-400 text-lg flex-shrink-0 cursor-pointer hover:text-gray-600" />
              </div>
              <button
                onClick={() => setShowAllFiltersModal(true)}
                className="flex items-center justify-center gap-2 h-11 px-3 py-2.5 lg:px-4 lg:py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-950 transition-colors shrink-0 lg:flex-none lg:text-xs"
              >
                <MdFilterList />
                <span className="hidden sm:inline">{t('listing.allFilters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-2 gap-2 w-full order-2 lg:order-2 lg:flex lg:flex-nowrap lg:items-center lg:gap-2 lg:flex-none">
              {/* Type Filter Dropdown */}
              <div ref={typeRef} className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className={`flex w-full items-center justify-between gap-2 h-11 px-4 py-2.5 lg:px-4 lg:py-2.5 rounded-xl text-sm font-medium transition-all border lg:text-xs ${
                    effectiveTypeFilter
                      ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <span className="min-w-0 truncate">{getCurrentTypeLabel()}</span>
                  <MdKeyboardArrowDown className={`transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[220px] py-1 animate-fadeIn">
                    {propertyTypes.map((type) => {
                      const IconComponent = type.icon;
                      const isActive = effectiveTypeFilter === type.value;
                      return (
                        <button
                          key={type.value || 'all'}
                          onClick={() => handleTypeFilter(type.value)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                            isActive
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <IconComponent className={`text-lg flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                          <span className="flex-1 text-left">{type.label}</span>
                          {isActive && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            {/* Category Filter Dropdown */}
            <div ref={categoryRef} className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`flex w-full items-center justify-between gap-2 h-11 px-4 py-2.5 lg:px-4 lg:py-2.5 rounded-xl text-sm font-medium transition-all border lg:text-xs ${
                  categoryFilter
                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className="min-w-0 truncate">{getCurrentCategoryLabel()}</span>
                <MdKeyboardArrowDown className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[200px] py-1 animate-fadeIn">
                  <button
                    onClick={() => handleCategoryFilter(null)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                      !categoryFilter
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <MdList className={`text-lg flex-shrink-0 ${!categoryFilter ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">{t('listing.allCategories')}</span>
                    {!categoryFilter && (
                      <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                  {propertyCategories.map((cat) => {
                    const IconComponent = cat.icon;
                    const isActive = categoryFilter === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => handleCategoryFilter(cat.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                          isActive
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <IconComponent className={`text-lg flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                        <span className="flex-1 text-left">{cat.label}</span>
                        {isActive && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Filter Dropdown */}
            <div ref={priceRef} className="relative">
              <button
                onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                className={`flex w-full items-center justify-between gap-2 h-11 px-4 py-2.5 lg:px-4 lg:py-2.5 rounded-xl text-sm font-medium transition-all border lg:text-xs ${
                  minPrice || maxPrice
                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className="min-w-0 truncate">{getPriceLabel()}</span>
                <MdKeyboardArrowDown className={`transition-transform ${showPriceDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showPriceDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-[280px] p-4 animate-fadeIn">
                  <h4 className="font-medium text-gray-800 mb-3">{t('listing.priceRange')}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        placeholder={t('listing.minPrice')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        placeholder={t('listing.maxPrice')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handlePriceFilter}
                    className="w-full py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    {t('listing.applyFilters')}
                  </button>
                </div>
              )}
            </div>

            {/* Rooms Filter Dropdown */}
            <div ref={roomsRef} className="relative">
              <button
                onClick={() => setShowRoomsDropdown(!showRoomsDropdown)}
                className={`flex w-full items-center justify-between gap-2 h-11 px-4 py-2.5 lg:px-4 lg:py-2.5 rounded-xl text-sm font-medium transition-all border lg:text-xs ${
                  roomsFilter
                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className="min-w-0 truncate">{getRoomsLabel()}</span>
                <MdKeyboardArrowDown className={`transition-transform ${showRoomsDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showRoomsDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[160px] py-1 animate-fadeIn">
                  <button
                    onClick={() => handleRoomsFilter(null)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      !roomsFilter
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{t('listing.all')}</span>
                    {!roomsFilter && (
                      <span className="ml-auto w-2 h-2 bg-teal-500 rounded-full" />
                    )}
                  </button>
                  {roomOptions.map((option) => {
                    const isActive = roomsFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleRoomsFilter(option.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-teal-50 text-teal-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isActive && (
                          <span className="ml-auto w-2 h-2 bg-teal-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-2 w-full order-3 lg:order-3 lg:w-auto lg:ml-auto">
              <div className="flex items-center gap-2 text-xs text-gray-500 lg:hidden">
                <span>{t('listing.propertiesFound', { count: filteredData.length })}</span>
                {activeFiltersCount > 0 && (
                  <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                    {t('listing.filtersApplied', { count: activeFiltersCount })}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span>{t('listing.clear')}</span>
                </button>
              )}
            </div>

            {/* Mobile List/Map Toggle */}
            <div className="flex items-center justify-between w-full order-4 lg:hidden">
              <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setMobileView("list")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    mobileView === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {t('listing.list')}
                </button>
                <button
                  onClick={() => setMobileView("map")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    mobileView === "map"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {t('listing.map')}
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {activeFiltersCount > 0 ? t('listing.filtersApplied', { count: activeFiltersCount }) : t('listing.all')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content - Map and Listings */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Map */}
      <div
        className={`w-full lg:w-[60%] relative lg:h-full ${
          mobileView === "map" ? "flex-1 h-full" : "h-[240px]"
        } ${mobileView === "list" ? "hidden lg:block" : ""}`}
      >
        <PropertiesMap
          properties={filteredData}
          onPropertyClick={handlePropertyClick}
          resizeKey={mobileView}
        />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <button className="bg-white p-2 rounded shadow hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="bg-white p-2 rounded shadow hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Side - Property Listings */}
      <div className={`w-full lg:w-[40%] h-full flex flex-col bg-white overflow-hidden ${mobileView === "map" ? "hidden lg:flex" : ""}`}>
        {/* Header */}
        <div className="p-4 border-b bg-white">
          {/* Search Title */}
            <div className="flex items-center justify-between">
              <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {filter
                ? t('listing.propertiesIn', { location: filter })
                : t('listing.allProperties')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('listing.propertiesFound', { count: filteredData.length })}
            </p>
          </div>
              {activeFiltersCount > 0 && (
                <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-1 rounded-full">
                  {t('listing.filtersApplied', { count: activeFiltersCount })}
                </span>
              )}
            </div>
        </div>

        {/* Property List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {filteredData.length > 0 ? (
            filteredData.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onCardClick={handlePropertyClick}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="mb-4">
                <MdSearch className="text-gray-300 text-7xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t('listing.noProperties')}
              </h3>
                <p className="text-gray-500 mb-4">
                {t('listing.tryAdjusting')}
              </p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    {t('listing.resetFilters')}
                  </button>
                )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* All Filters Modal */}
      {showAllFiltersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{t('listing.allFilters')}</h2>
              <button
                onClick={() => setShowAllFiltersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-6">
              {/* Property Type */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <MdSell className="text-teal-600" />
                  {t('admin.type')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map((type) => {
                    const IconComponent = type.icon;
                    const isActive = effectiveTypeFilter === type.value;
                    return (
                      <button
                        key={type.value || 'all'}
                        onClick={() => handleTypeFilter(type.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                          isActive
                            ? "bg-teal-50 border-teal-500 text-teal-700"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <IconComponent className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <HiOutlineOfficeBuilding className="text-teal-600" />
                  {t('listing.propertyUses')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCategoryFilter(null)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      !categoryFilter
                        ? "bg-teal-50 border-teal-500 text-teal-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <MdList className={!categoryFilter ? 'text-teal-600' : 'text-gray-400'} />
                    <span className="text-sm font-medium">{t('listing.allCategories')}</span>
                  </button>
                  {propertyCategories.map((cat) => {
                    const IconComponent = cat.icon;
                    const isActive = categoryFilter === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => handleCategoryFilter(cat.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                          isActive
                            ? "bg-teal-50 border-teal-500 text-teal-700"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <IconComponent className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">{t('listing.priceRange')}</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder={t('listing.minPrice')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder={t('listing.maxPrice')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Room Count */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">{t('listing.roomCount')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRoomsFilter(null)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      !roomsFilter
                        ? "bg-teal-50 border-teal-500 text-teal-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {t('listing.all')}
                  </button>
                  {roomOptions.map((option) => {
                    const isActive = roomsFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleRoomsFilter(option.value)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-teal-50 border-teal-500 text-teal-700"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
              >
                {t('listing.resetFilters')}
              </button>
              <button
                onClick={() => {
                  handlePriceFilter();
                  setShowAllFiltersModal(false);
                }}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                {t('listing.applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </main>
  );
};

export default Listing;
