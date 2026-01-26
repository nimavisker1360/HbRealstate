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

const Layout = () => {
  useFavourites();
  useBookings();

  const location = useLocation();
  const { isAuthenticated, user, getIdTokenClaims } = useAuth0();
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

  const { mutate } = useMutation({
    mutationKey: [user?.email],
    mutationFn: ({ userData, token }) => createUser(userData, token),
  });

  // Function to refresh token
  const refreshToken = useCallback(async () => {
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
  }, [getIdTokenClaims, setUserDetails]);

  useEffect(() => {
    const getTokenAndRegister = async () => {
      try {
        console.log("🔑 Layout: Getting ID token for", user?.email);
        const claims = await getIdTokenClaims();
        const token = claims?.__raw;

        if (token) {
          localStorage.setItem("access_token", token);
          setUserDetails((prev) => ({ ...prev, token: token }));
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
  }, [isAuthenticated, user, getIdTokenClaims, mutate, setUserDetails, refreshToken]);

  // Reset registration flag when user changes
  useEffect(() => {
    hasRegisteredRef.current = false;
  }, [user?.email]);

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
