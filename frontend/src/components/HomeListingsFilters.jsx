import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import {
  MdClose,
  MdFilterList,
  MdKeyboardArrowDown,
  MdLocationCity,
  MdLocationOn,
  MdPublic,
  MdSearch,
} from "react-icons/md";
import CurrencyContext from "../context/CurrencyContext";
import { getHomeSectionActiveFiltersCount } from "../utils/homeSectionFilters";

const HomeListingsFilters = ({
  searchValue,
  setSearchValue,
  categoryFilter,
  setCategoryFilter,
  priceRange,
  setPriceRange,
  roomsFilter,
  setRoomsFilter,
  quickFilters,
  setQuickFilters,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { selectedCurrency, baseCurrency, rates, formatMoney } = useContext(CurrencyContext);
  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);

  const projectRef = useRef(null);
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const roomsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectRef.current && !projectRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
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

  const projectPageOptions = useMemo(
    () => [
      {
        value: "local",
        label: t("nav.localProjects"),
        icon: MdLocationCity,
        route: "/projects?projectType=local",
      },
      {
        value: "international",
        label: t("nav.internationalProjects"),
        icon: MdPublic,
        route: "/projects?projectType=international",
      },
    ],
    [t]
  );

  const propertyCategories = useMemo(
    () => [
      { value: "residential", label: t("categories.residential") },
      { value: "villa", label: t("categories.villa") },
      { value: "commercial", label: t("categories.commercial") },
      { value: "land", label: t("categories.land") },
      { value: "residentialProjects", label: t("categories.residentialProjects") },
      { value: "building", label: t("categories.building") },
      { value: "timeshare", label: t("categories.timeshare") },
      { value: "touristFacility", label: t("categories.touristFacility") },
    ],
    [t]
  );

  const roomOptions = useMemo(
    () => [
      { value: "0", label: t("listing.studio") },
      { value: "1", label: t("listing.room1") },
      { value: "2", label: t("listing.room2") },
      { value: "3", label: t("listing.room3") },
      { value: "4", label: t("listing.room4") },
      { value: "5+", label: t("listing.room5plus") },
    ],
    [t]
  );

  const formatCurrency = (num) =>
    formatMoney(
      Number(num || 0),
      displayCurrency,
      i18n.language === "tr" ? "tr-TR" : "en-US"
    );

  const getPriceLabel = () => {
    if (priceRange.min || priceRange.max) {
      if (priceRange.min && priceRange.max) {
        return `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`;
      }
      if (priceRange.min) return `${formatCurrency(priceRange.min)}+`;
      return `${t("listing.maxPrice")}: ${formatCurrency(priceRange.max)}`;
    }
    return t("listing.price");
  };

  const getRoomsLabel = () => {
    if (roomsFilter) {
      const option = roomOptions.find((item) => item.value === roomsFilter);
      return option ? option.label : t("listing.rooms");
    }
    return t("listing.rooms");
  };

  const activeFiltersCount = getHomeSectionActiveFiltersCount({
    searchValue,
    categoryFilter,
    priceRange,
    roomsFilter,
    quickFilters,
  });

  const handleProjectNavigation = (route) => {
    setShowProjectDropdown(false);
    navigate(route);
  };

  const handleAllFilters = () => {
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set("search", searchValue.trim());
    if (categoryFilter) params.set("category", categoryFilter);
    if (priceRange.min) params.set("minPrice", priceRange.min);
    if (priceRange.max) params.set("maxPrice", priceRange.max);
    if (roomsFilter) params.set("rooms", roomsFilter);
    if (quickFilters.seaView) params.set("seaView", "true");
    if (quickFilters.installmentAvailable) params.set("installmentAvailable", "true");
    if (quickFilters.citizenshipEligible) params.set("citizenshipEligible", "true");
    if (quickFilters.status) params.set("status", quickFilters.status);
    const queryString = params.toString();
    navigate(`/listing${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="relative z-[60] mx-auto mb-8 max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200/80 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur isolation-isolate">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:p-4">
          <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[260px]">
            <div className="flex items-center gap-2 w-full min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
              <MdLocationOn className="text-gray-400 text-lg flex-shrink-0" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("listing.locationPlaceholder")}
                className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={t("listing.clear")}
                >
                  <MdClose size={16} />
                </button>
              )}
              <MdSearch className="text-gray-400 text-lg flex-shrink-0" />
            </div>

            <div ref={projectRef} className="relative w-[132px] shrink-0 sm:w-auto">
              <button
                type="button"
                onClick={() => setShowProjectDropdown((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="flex-1 text-left">{t("nav.projects")}</span>
                <MdKeyboardArrowDown
                  className={`transition-transform ${showProjectDropdown ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`absolute top-full right-0 mt-2 w-[220px] max-w-[calc(100vw-2rem)] rounded-lg bg-white z-[70] sm:left-0 sm:right-auto sm:min-w-[220px] sm:w-auto origin-top transition-all duration-300 ease-out ${
                  showProjectDropdown
                    ? "max-h-[320px] translate-y-0 opacity-100 border border-gray-200 shadow-lg py-1 pointer-events-auto"
                    : "max-h-0 -translate-y-2 opacity-0 border border-transparent shadow-none py-0 pointer-events-none"
                }`}
              >
                <div className="max-h-[320px] overflow-y-auto">
                  {projectPageOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleProjectNavigation(option.route)}
                        className="w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-emerald-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <IconComponent className="text-base" />
                          </div>
                          <span className="flex-1 text-left leading-tight whitespace-normal break-words">
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <div ref={categoryRef} className="relative col-span-2 sm:col-span-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="min-w-0 flex-1 truncate">
                  {categoryFilter ? propertyCategories.find((cat) => cat.value === categoryFilter)?.label || t("listing.propertyUses") : t("listing.propertyUses")}
                </span>
                <MdKeyboardArrowDown
                  className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-[70] max-h-[280px] overflow-y-auto sm:right-auto sm:min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter(null);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      !categoryFilter
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    {t("listing.allCategories")}
                  </button>
                  {propertyCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat.value);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        categoryFilter === cat.value
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-700 hover:bg-emerald-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={priceRef} className="relative col-span-1 sm:col-span-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPriceDropdown((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="min-w-0 flex-1 truncate">{getPriceLabel()}</span>
                <MdKeyboardArrowDown
                  className={`transition-transform ${showPriceDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showPriceDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-[70] sm:right-auto sm:w-[260px]">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">
                    {t("listing.priceRange")}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder={t("listing.minPrice")}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder={t("listing.maxPrice")}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPriceDropdown(false)}
                    className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
                  >
                    {t("listing.applyFilters")}
                  </button>
                </div>
              )}
            </div>

            <div ref={roomsRef} className="relative col-span-1 sm:col-span-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setShowRoomsDropdown((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="min-w-0 flex-1 truncate">{getRoomsLabel()}</span>
                <MdKeyboardArrowDown
                  className={`transition-transform ${showRoomsDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showRoomsDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-[70] sm:right-auto sm:min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRoomsFilter("");
                      setShowRoomsDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      !roomsFilter
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    {t("listing.all")}
                  </button>
                  {roomOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRoomsFilter(option.value);
                        setShowRoomsDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        roomsFilter === option.value
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-700 hover:bg-emerald-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-center">
            <button
              type="button"
              onClick={handleAllFilters}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 sm:w-auto"
            >
              <MdFilterList />
              <span>{t("listing.allFilters")}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200/80 px-3 pb-3 sm:px-4 sm:pb-4">
          <button
            type="button"
            onClick={() => setQuickFilters((prev) => ({ ...prev, seaView: !prev.seaView }))}
            aria-pressed={quickFilters.seaView}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              quickFilters.seaView
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            {t("listing.quickSeaView")}
          </button>

          <button
            type="button"
            onClick={() =>
              setQuickFilters((prev) => ({
                ...prev,
                installmentAvailable: !prev.installmentAvailable,
              }))
            }
            aria-pressed={quickFilters.installmentAvailable}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              quickFilters.installmentAvailable
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            {t("listing.quickInstallmentAvailable")}
          </button>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setQuickFilters((prev) => ({
                  ...prev,
                  status: prev.status === "ready" ? "" : "ready",
                }))
              }
              aria-pressed={quickFilters.status === "ready"}
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                quickFilters.status === "ready"
                  ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              {t("listing.quickReady")}
            </button>
            <button
              type="button"
              onClick={() =>
                setQuickFilters((prev) => ({
                  ...prev,
                  status: prev.status === "offplan" ? "" : "offplan",
                }))
              }
              aria-pressed={quickFilters.status === "offplan"}
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                quickFilters.status === "offplan"
                  ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              {t("listing.quickOffPlan")}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setQuickFilters((prev) => ({
                ...prev,
                citizenshipEligible: !prev.citizenshipEligible,
              }))
            }
            aria-pressed={quickFilters.citizenshipEligible}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              quickFilters.citizenshipEligible
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            {t("listing.quickCitizenshipEligible")}
          </button>
        </div>
      </div>
    </div>
  );
};

HomeListingsFilters.propTypes = {
  searchValue: PropTypes.string.isRequired,
  setSearchValue: PropTypes.func.isRequired,
  categoryFilter: PropTypes.string,
  setCategoryFilter: PropTypes.func.isRequired,
  priceRange: PropTypes.shape({
    min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  setPriceRange: PropTypes.func.isRequired,
  roomsFilter: PropTypes.string,
  setRoomsFilter: PropTypes.func.isRequired,
  quickFilters: PropTypes.shape({
    seaView: PropTypes.bool,
    installmentAvailable: PropTypes.bool,
    citizenshipEligible: PropTypes.bool,
    status: PropTypes.string,
  }).isRequired,
  setQuickFilters: PropTypes.func.isRequired,
};

export default HomeListingsFilters;
