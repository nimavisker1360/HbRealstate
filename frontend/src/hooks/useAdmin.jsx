import { useContext, useEffect, useState, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import UserDetailContext from "../context/UserDetailContext";
import { checkAdmin } from "../utils/api";

const MAX_ADMIN_CHECK_RETRIES = 3;
const ADMIN_CHECK_RETRY_DELAY_MS = 1200;
const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
const CONFIGURED_ADMIN_EMAILS = new Set(
  String(import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(/[,\s;]+/)
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
);

const useAdmin = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const { userDetails } = useContext(UserDetailContext);
  const { token, userReady, userReadyEmail, adminStatus, adminStatusEmail } =
    userDetails;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryTick, setRetryTick] = useState(0);
  const lastCheckedRef = useRef({ email: null, token: null });
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const fetchAdminStatus = async () => {
      const normalizedEmail = normalizeEmail(
        userReadyEmail || adminStatusEmail || user?.email
      );

      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        setIsAdmin(false);
        setLoading(false);
        retryCountRef.current = 0;
        lastCheckedRef.current = { email: null, token: null };
        return;
      }

      if (!normalizedEmail) {
        setLoading(true);
        return;
      }

      if (CONFIGURED_ADMIN_EMAILS.has(normalizedEmail)) {
        setIsAdmin(true);
        setLoading(false);
        retryCountRef.current = 0;
        lastCheckedRef.current = { email: normalizedEmail, token };
        return;
      }

      if (!token) {
        setLoading(true);
        return;
      }

      if (!userReady || userReadyEmail !== normalizedEmail) {
        setLoading(true);
        return;
      }

      if (adminStatusEmail === normalizedEmail && typeof adminStatus === "boolean") {
        setIsAdmin(adminStatus);
        setLoading(false);
        lastCheckedRef.current = { email: normalizedEmail, token };
        retryCountRef.current = 0;
        return;
      }

      const wasAlreadyChecked =
        lastCheckedRef.current.email === normalizedEmail &&
        lastCheckedRef.current.token === token;

      if (wasAlreadyChecked) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await checkAdmin(normalizedEmail, token);
        setIsAdmin(Boolean(result?.isAdmin));
        lastCheckedRef.current = { email: normalizedEmail, token };
        retryCountRef.current = 0;
        setLoading(false);
      } catch (error) {
        const status = error?.response?.status;

        // Definitive "not admin" states
        if (status === 403 || status === 404) {
          setIsAdmin(false);
          lastCheckedRef.current = { email: normalizedEmail, token };
          retryCountRef.current = 0;
          setLoading(false);
          return;
        }

        // Transient error (401/token refresh/network): retry before giving up
        if (retryCountRef.current < MAX_ADMIN_CHECK_RETRIES) {
          retryCountRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            setRetryTick((prev) => prev + 1);
          }, ADMIN_CHECK_RETRY_DELAY_MS);
          return;
        }

        setLoading(false);
      }
    };

    fetchAdminStatus();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    authLoading,
    user?.email,
    token,
    retryTick,
    userReady,
    userReadyEmail,
    adminStatus,
    adminStatusEmail,
  ]);

  return { isAdmin, loading };
};

export default useAdmin;
