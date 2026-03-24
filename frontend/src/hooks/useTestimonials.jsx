import { useQuery } from "react-query";
import { getAllTestimonials } from "../utils/api";

const useTestimonials = (options = {}) => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allTestimonials",
    getAllTestimonials,
    { refetchOnWindowFocus: false, ...options }
  );

  const normalized = Array.isArray(data)
    ? data
    : Array.isArray(data?.testimonials)
      ? data.testimonials
      : [];

  return { data: normalized, isLoading, isError, refetch };
};

export default useTestimonials;
