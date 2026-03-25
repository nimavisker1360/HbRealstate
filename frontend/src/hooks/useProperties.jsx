
import { useQuery } from "react-query";
import { getAllProperties } from "../utils/api";

const useProperties = ({
  includeDraft = false,
  token,
  enabled = true,
} = {}) => {
  const { data, isLoading, isError, refetch } = useQuery(
    ["allProperties", includeDraft ? "admin" : "public"],
    () => getAllProperties({ includeDraft, token }),
    {
      refetchOnWindowFocus: false,
      enabled: includeDraft ? enabled && Boolean(token) : enabled,
    }
  );
  return {
    data,
    isLoading,
    isError,
    refetch,
  };
};

export default useProperties;
