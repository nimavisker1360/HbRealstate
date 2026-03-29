import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { buildCurrentReturnTo } from "../utils/postLoginResume";

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const redirectTriggeredRef = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || redirectTriggeredRef.current) return;

    redirectTriggeredRef.current = true;
    loginWithRedirect({
      appState: { returnTo: buildCurrentReturnTo() },
      authorizationParams: {
        scope: "openid profile email",
      },
    });
  }, [
    isAuthenticated,
    isLoading,
    loginWithRedirect,
  ]);

  if (isLoading || !isAuthenticated) return null;
  return children;
};

export default RequireAuth;
