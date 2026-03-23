import { useSearchParams } from "react-router-dom";
import Listing from "../Listing";
import SEO from "../../components/SEO";

const ListingSeoPage = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = String(searchParams.get("search") || "").trim();
  const city = String(searchParams.get("city") || "").trim();

  const locationHint = searchTerm || city;
  const title = locationHint
    ? `${locationHint} Property Listings | Demo Real Estate`
    : "Turkey Property Listings | Demo Real Estate";

  const description = locationHint
    ? `Browse verified apartments, villas, and investment opportunities in ${locationHint}. Compare prices, features, and locations with Demo Real Estate.`
    : "Browse verified apartments, villas, and investment opportunities across Turkey. Compare prices, features, and locations with Demo Real Estate.";

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical="https://www.demo.com/listing"
      />
      <Listing />
    </>
  );
};

export default ListingSeoPage;
