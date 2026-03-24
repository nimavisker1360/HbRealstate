
import { useQuery } from "react-query";
import { getAllProperties } from "../utils/api";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const useProperties = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allProperties",
    getAllProperties,
    { refetchOnWindowFocus: false }
  );
  return {
    data: ensureArray(data),
    isLoading,
    isError,
    refetch,
  };
};

export default useProperties;
