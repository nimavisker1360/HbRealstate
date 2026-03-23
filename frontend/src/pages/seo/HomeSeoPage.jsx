import Home from "../Home";
import SEO from "../../components/SEO";

const HomeSeoPage = () => {
  return (
    <>
      <SEO
        title="Demo Real Estate | Turkey Property & Investment Opportunities"
        description="Explore apartments, villas, and investment-ready projects across Istanbul, Kyrenia, and major Turkish markets with Demo Real Estate."
        canonical="https://www.demo.com/"
      />
      <Home />
    </>
  );
};

export default HomeSeoPage;
