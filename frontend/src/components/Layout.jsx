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

const INACTIVITY_LIMIT_MS = 6 * 60 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 60 * 1000;
const LAST_ACTIVITY_KEY = "last_activity_ts";

const Layout = () => {
  useFavourites();
  useBookings();

  const location = useLocation();
  const { isAuthenticated, user, getIdTokenClaims, logout, isLoading } = useAuth0();
  const { setUserDetails } = useContext(UserDetailContext);
  const tokenRefreshIntervalRef = useRef(null);
  const hasRegisteredRef = useRef(false);
  const lastActivityWriteRef = useRef(0);
  const canRecordActivityRef = useRef(false);
  const isForcingLogoutRef = useRef(false);

  // Hide footer on listing, admin, addresses, projects, and blog pages
  const hideFooter =
    location.pathname === "/listing" ||
    location.pathname === "/admin" ||
    location.pathname === "/addresses" ||
    location.pathname.startsWith("/projects") ||
    location.pathname.startsWith("/blog");

  const { mutate } = useMutation({
    mutationKey: [user?.email],
    mutationFn: ({ userData, token }) => createUser(userData, token),
  });

  const getLastActivity = useCallback(() => {
    try {
      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const parsed = raw ? Number(raw) : 0;
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (error) {
      return 0;
    }
  }, []);

  const isSessionExpired = useCallback(() => {
    const lastActivity = getLastActivity();
    if (!lastActivity) {
      // No activity yet; treat as active
      return false;
    }
    const diff = Date.now() - lastActivity;
    const expired = diff > INACTIVITY_LIMIT_MS;
    return expired;
  }, [getLastActivity]);

  const recordActivity = useCallback(
    (force = false) => {
      if (!canRecordActivityRef.current) return;
      const now = Date.now();
      if (!force && now - lastActivityWriteRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        lastActivityWriteRef.current = now;
      } catch (error) {
        // Ignore storage errors (private mode, quota issues)
      }
    },
    []
  );

  const setLastActivityNow = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      lastActivityWriteRef.current = now;
    } catch (error) {
      // Ignore storage errors
    }
  }, []);

  const forceLogout = useCallback(() => {
    if (isForcingLogoutRef.current) return;
    isForcingLogoutRef.current = true;

    try {
      localStorage.removeItem("access_token");
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (error) {
      // Ignore storage errors
    }

    setUserDetails((prev) => ({
      ...prev,
      token: null,
      favourites: [],
      bookings: [],
    }));

    setTokenRefreshCallback(null);
    logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout, setUserDetails]);

  // Function to refresh token
  const refreshToken = useCallback(async () => {
    if (isSessionExpired()) {
      forceLogout();
      return null;
    }
    try {
      console.log("🔄 Layout: Refreshing token...");
      const claims = await getIdTokenClaims();
      const token = claims?.__raw;

      if (token) {
        localStorage.setItem("access_token", token);
        setUserDetails((prev) => ({ ...prev, token: token }));
        console.log("✅ Layout: Token refreshed successfully");
        return token;
      }
    } catch (error) {
      console.error("❌ Layout: Failed to refresh token", error.message);
    }
    return null;
  }, [getIdTokenClaims, setUserDetails, isSessionExpired, forceLogout]);

  useEffect(() => {
    const getTokenAndRegister = async () => {
      try {
        console.log("🔑 Layout: Getting ID token for", user?.email);
        const claims = await getIdTokenClaims();
        const token = claims?.__raw;

        if (token) {
          localStorage.setItem("access_token", token);
          setUserDetails((prev) => ({ ...prev, token: token }));
          setLastActivityNow();
          console.log("✅ Layout: ID Token received");

          // Set the token refresh callback for API interceptor
          setTokenRefreshCallback(refreshToken);

          // Send user data to database (only once per session)
          if (!hasRegisteredRef.current) {
            const userData = {
              email: user.email,
              name: user.name,
              image: user.picture,
            };
            console.log("📤 Layout: Registering user to database", userData);
            mutate({ userData, token: token });
            hasRegisteredRef.current = true;
          }
        }
      } catch (error) {
        console.error("❌ Layout: Failed to get token", error.message);
      }
    };

    if (isAuthenticated && user?.email) {
      if (isSessionExpired()) {
        forceLogout();
        return;
      }
      getTokenAndRegister();

      // Set up token refresh every 15 minutes
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      tokenRefreshIntervalRef.current = setInterval(() => {
        refreshToken();
      }, 15 * 60 * 1000); // 15 minutes
    }

    // Cleanup interval on unmount
    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [
    isAuthenticated,
    user,
    getIdTokenClaims,
    mutate,
    setUserDetails,
    refreshToken,
    isSessionExpired,
    forceLogout,
    setLastActivityNow,
  ]);

  // Reset registration flag when user changes
  useEffect(() => {
    hasRegisteredRef.current = false;
  }, [user?.email]);

  // Initial inactivity check before recording any new activity
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isSessionExpired()) {
      forceLogout();
      return;
    }

    canRecordActivityRef.current = true;
    recordActivity(true);
  }, [isLoading, isAuthenticated, isSessionExpired, forceLogout, recordActivity]);

  // Record activity on route change
  useEffect(() => {
    recordActivity(true);
  }, [location.pathname, recordActivity]);

  // Record activity on user interactions
  useEffect(() => {
    const handleActivity = () => recordActivity();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        recordActivity(true);
      }
    };

    const events = ["click", "keydown", "scroll", "mousemove", "touchstart"];
    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [recordActivity]);

  // Periodically check for inactivity
  useEffect(() => {
    if (isLoading) return;

    const checkInactivity = () => {
      if (isAuthenticated && isSessionExpired()) {
        forceLogout();
      }
    };

    const intervalId = setInterval(checkInactivity, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isLoading, isSessionExpired, forceLogout]);

  return (
    <div className="overflow-x-hidden min-h-screen flex flex-col">
      <div className="flex-1">
        <Header />
        <Outlet />
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
