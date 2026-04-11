import React, { useContext, useMemo, useState } from 'react'
import { Link } from "react-router-dom";
import Hero from '../components/Hero'
import HomeContactStrip from "../components/HomeContactStrip";
import About from '../components/About'
import Properties from '../components/Properties'
import ConsultantsSection from '../components/ConsultantsSection'
import HomeLocalProjectsSection from "../components/HomeLocalProjectsSection";
import Blogs from '../components/Blogs'
import useProperties from "../hooks/useProperties";
import CurrencyContext from "../context/CurrencyContext";
import HomeListingsFilters from "../components/HomeListingsFilters";
import { filterHomeSectionProperties } from "../utils/homeSectionFilters";


const Home = () => {
    const { data } = useProperties();
    const { selectedCurrency, baseCurrency, rates, convertAmount } = useContext(CurrencyContext);
    const displayCurrency =
      selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
        ? selectedCurrency
        : baseCurrency;

    const [searchValue, setSearchValue] = useState("");
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [priceRange, setPriceRange] = useState({ min: "", max: "" });
    const [roomsFilter, setRoomsFilter] = useState("");
    const [quickFilters, setQuickFilters] = useState({
      seaView: false,
      installmentAvailable: false,
      citizenshipEligible: false,
      status: "",
    });

    const sharedFilters = useMemo(
      () => ({
        searchValue,
        categoryFilter,
        priceRange,
        roomsFilter,
        quickFilters,
      }),
      [searchValue, categoryFilter, priceRange, roomsFilter, quickFilters]
    );

    const homeProjects = useMemo(
      () =>
        filterHomeSectionProperties(data, sharedFilters, {
          section: "local-projects",
          convertAmount,
          defaultCurrency: baseCurrency,
          comparisonCurrency: displayCurrency,
        }),
      [data, sharedFilters, convertAmount, baseCurrency, displayCurrency]
    );

    const homeListings = useMemo(
      () =>
        filterHomeSectionProperties(data, sharedFilters, {
          section: "listings",
          convertAmount,
          defaultCurrency: baseCurrency,
          comparisonCurrency: displayCurrency,
        }),
      [data, sharedFilters, convertAmount, baseCurrency, displayCurrency]
    );

    return (
        <main>
            <Hero />
            <HomeContactStrip />
            <About />
            {/* Divider Line */}
            <div className="w-full border-t border-gray-300"></div>
            <HomeListingsFilters
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              roomsFilter={roomsFilter}
              setRoomsFilter={setRoomsFilter}
              quickFilters={quickFilters}
              setQuickFilters={setQuickFilters}
            />
            <HomeLocalProjectsSection properties={homeProjects} />
            {/* Divider Line */}
            <div className="w-full border-t border-gray-300"></div>
            <Properties properties={homeListings} showControls={false} />
            {/* Divider Line */}
            <div className="w-full border-t border-gray-300"></div>
            <ConsultantsSection />
            <Blogs limit={4} showMore />
            <nav aria-label="SEO internal links" className="sr-only">
                <Link to="/listing">Listing</Link>
                <Link to="/projects">Projects</Link>
                <Link to="/istanbul-apartments">Istanbul Apartments</Link>
                <Link to="/kyrenia-apartments">Kyrenia Apartments</Link>
                <Link to="/turkey-property-investment">Turkey Property Investment</Link>
                <Link to="/turkish-citizenship-property">Turkish Citizenship Property</Link>
            </nav>
        </main>
    )
}

export default Home
