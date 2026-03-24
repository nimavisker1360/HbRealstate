import { useQuery } from "react-query";
import { getAllConsultants } from "../utils/api";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const useConsultants = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allConsultants",
    getAllConsultants,
    { refetchOnWindowFocus: false }
  );

  return {
    data: ensureArray(data),
    isError,
    isLoading,
    refetch,
  };
};

export default useConsultants;
