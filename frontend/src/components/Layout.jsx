import { useContext, useEffect, useCallback, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import UserDetailContext from "../context/UserDetailContext";
import { useMutation } from "react-query";
import { createUser, setTokenRefreshCallback } from "../utils/api";
import useFavourites from "../hooks/useFavourites.jsx";
import useBookings from "../hooks/useBookings.jsx";
import useImageOptimization from "../hooks/useImageOptimization";
import { trackWhatsAppConversionFromClick } from "../utils/analytics";
import { captureAttributionParams } from "../utils/attribution";
import AssistantChatWidget from "./AssistantChatModal";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const Layout = () => {
  useFavourites();
  useBookings();
  useImageOptimization();

  const location = useLocation();
  const {
    isAuthenticated,
    user,
    getIdTokenClaims,
    getAccessTokenSilently,
    isLoading,
  } = useAuth0();
  const { setUserDetails } = useContext(UserDetailContext);
  const tokenRefreshIntervalRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  // Hide footer on listing, admin, addresses, projects, and blog pages
  const hideFooter =
    location.pathname === "/listing" ||
    location.pathname === "/admin" ||
    location.pathname === "/addresses" ||
    location.pathname.startsWith("/projects") ||
    location.pathname.startsWith("/blog");

  const { mutateAsync: registerUser } = useMutation({
    mutationKey: [user?.email],
    mutationFn: ({ userData, token }) => createUser(userData, token),
  });

  const getFreshIdToken = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) {
        try {
          await getAccessTokenSilently({
            cacheMode: "off",
            authorizationParams: {
              scope: "openid profile email",
            },
          });
        } catch (error) {
          console.warn("Layout: Silent token refresh failed:", error?.message);
        }
      }

      const claims = await getIdTokenClaims();
      const rawToken = claims?.__raw;
      if (!rawToken) return null;

      try {
        const payload = JSON.parse(atob(rawToken.split(".")[1]));
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < nowSec + 30) {
          console.warn("Layout: ID token expired or expiring within 30 s");
          return null;
        }
      } catch (_) {
        // Malformed token — treat as unusable
        return null;
      }

      return rawToken;
    },
    [getAccessTokenSilently, getIdTokenClaims]
  );

  const refreshToken = useCallback(async () => {
    try {
      const token = await getFreshIdToken(true);

      if (token) {
        localStorage.setItem("access_token", token);
        setUserDetails((prev) =>
          prev.token === token ? prev : { ...prev, token: token }
        );
        return token;
      }

      // Token couldn't be refreshed — clear stale state
      localStorage.removeItem("access_token");
      setUserDetails((prev) => (prev.token ? { ...prev, token: null } : prev));
    } catch (error) {
      console.error("Layout: Failed to refresh token", error?.message);
    }
    return null;
  }, [getFreshIdToken, setUserDetails]);

  useEffect(() => {
    const getTokenAndRegister = async () => {
      const normalizedEmail = normalizeEmail(user?.email);

      try {
        const token = await getFreshIdToken(true);

        // Always register the refresh callback so the 401 interceptor can try
        setTokenRefreshCallback(refreshToken);

        if (token) {
          localStorage.setItem("access_token", token);
          setUserDetails((prev) =>
            prev.token === token ? prev : { ...prev, token: token }
          );

          // Send user data to database (only once per session)
          if (!hasRegisteredRef.current) {
            setUserDetails((prev) => ({
              ...prev,
              userReady: false,
              userReadyEmail: normalizedEmail || null,
              adminStatus: null,
              adminStatusEmail: null,
            }));

            const userData = {
              email: user.email,
              name: user.name,
              image: user.picture,
            };

            try {
              const registrationResult = await registerUser({
                userData,
                token,
              });

              hasRegisteredRef.current = true;
              setUserDetails((prev) => ({
                ...prev,
                userReady: true,
                userReadyEmail: normalizedEmail || null,
                adminStatus:
                  typeof registrationResult?.user?.isAdmin === "boolean"
                    ? registrationResult.user.isAdmin
                    : null,
                adminStatusEmail: normalizedEmail || null,
              }));
            } catch (error) {
              setUserDetails((prev) => ({
                ...prev,
                userReady: true,
                userReadyEmail: normalizedEmail || null,
                adminStatus: null,
                adminStatusEmail: null,
              }));
              console.error("Layout: Failed to sync user", error?.message);
            }
          } else {
            setUserDetails((prev) => ({
              ...prev,
              userReadyEmail: normalizedEmail || null,
            }));
          }
        } else {
          // Token expired and can't be refreshed — clear stale state
          localStorage.removeItem("access_token");
          setUserDetails((prev) =>
            prev.token ? { ...prev, token: null } : prev
          );
        }
      } catch (error) {
        console.error("Layout: Failed to get token", error?.message);
      }
    };

    if (isAuthenticated && user?.email) {
      getTokenAndRegister();

      // Set up token refresh every 15 minutes
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      tokenRefreshIntervalRef.current = setInterval(() => {
        refreshToken();
      }, 15 * 60 * 1000);
    }

    // Cleanup interval on unmount
    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [
    isAuthenticated,
    user?.email,
    user?.name,
    user?.picture,
    registerUser,
    setUserDetails,
    refreshToken,
    getFreshIdToken,
  ]);

  // Reset registration flag when user changes
  useEffect(() => {
    hasRegisteredRef.current = false;
  }, [user?.email]);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    setTokenRefreshCallback(null);
    setUserDetails((prev) => {
      const alreadyCleared =
        !prev.token &&
        Array.isArray(prev.favourites) &&
        prev.favourites.length === 0 &&
        Array.isArray(prev.bookings) &&
        prev.bookings.length === 0 &&
        !prev.userReady &&
        !prev.userReadyEmail &&
        prev.adminStatus === null &&
        !prev.adminStatusEmail;
      if (alreadyCleared) return prev;

        return {
          ...prev,
          token: null,
          favourites: [],
          bookings: [],
          userReady: false,
          userReadyEmail: null,
          adminStatus: null,
          adminStatusEmail: null,
        };
      });

    try {
      localStorage.removeItem("access_token");
    } catch (error) {
      // Ignore storage errors
    }
  }, [isAuthenticated, isLoading, setUserDetails]);

  useEffect(() => {
    // Capture phase ensures WhatsApp clicks are tracked even when inner handlers stop propagation.
    const handleDocumentClick = (event) => {
      trackWhatsAppConversionFromClick(event);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    captureAttributionParams();
  }, [location.pathname, location.search]);

  return (
    <div className="overflow-x-hidden min-h-screen flex flex-col">
      <div className="flex-1">
        <Header />
        <Outlet />
      </div>
      {!hideFooter && <Footer />}
      <AssistantChatWidget />
    </div>
  );
};

export default Layout;
