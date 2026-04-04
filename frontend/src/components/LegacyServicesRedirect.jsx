import { Navigate, useLocation } from "react-router-dom";

/** Redirects legacy /listing service URLs to the canonical /services/* paths. */
const LegacyServicesRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const target = pathname.replace(/^\/listing/, "/services");
  return <Navigate to={`${target}${search}${hash}`} replace />;
};

export default LegacyServicesRedirect;
