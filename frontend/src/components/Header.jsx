import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "./Navbar";
import { MdArrowBack, MdClose, MdMenu, MdSearch } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import userIcon from "../assets/user.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import ProfileMenu from "./ProfileMenu";
import LoginModal from "./LoginModal";
import ContactModal from "./ContactModal";
import ProfileModal from "./ProfileModal";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchOverlay from "./SearchOverlay";
import { normalizeWhatsAppNumber } from "../utils/common";
import { PRIMARY_CONTACT_PHONE } from "../constant/data";
import logo from "../assets/logo.png";
import CurrencyContext from "../context/CurrencyContext";
import { LOGIN_MODAL_REQUEST_EVENT } from "../utils/loginPrompt";
import {
  buildCurrentReturnTo,
  consumePostLoginResume,
  getPostLoginResume,
  savePostLoginResume,
} from "../utils/postLoginResume";
import { getLiveSsoToken, getLiveToken } from "../utils/api";

const Header = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [pendingLiveLogin, setPendingLiveLogin] = useState(false);
  const [liveRedirecting, setLiveRedirecting] = useState(false);
  const headerRef = useRef(null);
  const { currencies, selectedCurrency, setSelectedCurrency } =
    useContext(CurrencyContext);
  const location = useLocation();
  const navigate = useNavigate();
  const liveAppUrl =
    import.meta.env.VITE_LIVE_APP_URL || "https://live.hbrealstate.com";
  const toggleMenu = () => setMenuOpened(!menuOpened);
  const {
    isAuthenticated,
    user,
    logout,
    isLoading,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  const navigateAwayFromLoginRoute = useCallback(() => {
    if (location.pathname !== "/login") return;

    const background = location.state?.loginBackground;
    if (
      background &&
      typeof background.pathname === "string" &&
      background.pathname !== "/login"
    ) {
      navigate(
        {
          pathname: background.pathname || "/",
          search: background.search || "",
          hash: background.hash || "",
        },
        { replace: true }
      );
      return;
    }

    navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate]);

  const openLoginRoute = useCallback(() => {
    const returnTo = buildCurrentReturnTo();
    const existingResume = getPostLoginResume();

    if (!existingResume) {
      savePostLoginResume({
        type: "login",
        returnTo,
      });
    }

    setLoginModalOpen(true);

    if (location.pathname !== "/login") {
      navigate("/login", {
        state: {
          loginBackground: {
            pathname: location.pathname || "/",
            search: location.search || "",
            hash: location.hash || "",
          },
        },
      });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  const handleLoginClick = () => {
    openLoginRoute();
  };

  const buildLiveRedirectUrl = useCallback(
    (token) => `${liveAppUrl}?token=${encodeURIComponent(token)}`,
    [liveAppUrl]
  );

  const getLiveCallbackUrl = useCallback(() => {
    const callbackValue = new URLSearchParams(location.search || "").get(
      "callbackUrl"
    );

    if (!callbackValue) return null;

    try {
      const callbackUrl = new URL(callbackValue);
      const allowedLiveOrigin = new URL(liveAppUrl).origin;

      if (
        callbackUrl.origin !== allowedLiveOrigin ||
        callbackUrl.pathname !== "/api/auth/sso"
      ) {
        return null;
      }

      return callbackUrl.toString();
    } catch {
      return null;
    }
  }, [liveAppUrl, location.search]);

  const getFreshIdToken = useCallback(async () => {
    try {
      await getAccessTokenSilently({
        cacheMode: "off",
        authorizationParams: {
          scope: "openid profile email",
        },
      });
    } catch (error) {
      // Fall back to current ID token claims below.
    }

    const claims = await getIdTokenClaims();
    return claims?.__raw || null;
  }, [getAccessTokenSilently, getIdTokenClaims]);

  const startLiveLoginFlow = useCallback(() => {
    const returnTo = buildCurrentReturnTo();
    savePostLoginResume({
      type: "live-stream",
      targetUrl: liveAppUrl,
      returnTo,
    });
    setPendingLiveLogin(true);
    setLoginModalOpen(true);
  }, [liveAppUrl]);

  const redirectToLiveWithToken = useCallback(async () => {
    setLiveRedirecting(true);
    try {
      const auth0Token = await getFreshIdToken();
      if (!auth0Token) {
        startLiveLoginFlow();
        return;
      }

      const response = await getLiveToken(auth0Token);
      if (response?.token) {
        window.location.assign(buildLiveRedirectUrl(response.token));
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        startLiveLoginFlow();
        return;
      }

      console.error("Failed to create live stream token:", error);
    } finally {
      setLiveRedirecting(false);
    }
  }, [buildLiveRedirectUrl, getFreshIdToken, startLiveLoginFlow]);

  const redirectToLiveCallback = useCallback(
    async (callbackUrl) => {
      if (liveRedirecting) return;

      setLiveRedirecting(true);
      try {
        const auth0Token = await getFreshIdToken();
        if (!auth0Token) {
          setLoginModalOpen(true);
          return;
        }

        const response = await getLiveSsoToken(auth0Token);
        if (response?.token) {
          const nextUrl = new URL(callbackUrl);
          nextUrl.searchParams.set("token", response.token);
          window.location.assign(nextUrl.toString());
        }
      } catch (error) {
        console.error("Failed to create live SSO token:", error);
      } finally {
        setLiveRedirecting(false);
      }
    },
    [getFreshIdToken, liveRedirecting]
  );

  const handleLiveClick = async () => {
    if (isLoading || liveRedirecting) return;

    if (!isAuthenticated) {
      startLiveLoginFlow();
      return;
    }

    await redirectToLiveWithToken();
  };

  const handleLoginModalClose = () => {
    if (pendingLiveLogin) {
      consumePostLoginResume("live-stream");
      setPendingLiveLogin(false);
    }
    consumePostLoginResume("login");
    setLoginModalOpen(false);
    navigateAwayFromLoginRoute();
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        // Close the menu if open when scrolling occurs
        if (menuOpened) {
          setMenuOpened(false);
        }
      }
      // detect scroll
      setActive(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    // clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpened]); // Dependency array ensures that the effect runs when menuOpened changes

  useEffect(() => {
    if (!menuOpened) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpened]);

  const searchParams = new URLSearchParams(location.search || "");
  const isAuthRedirectInProgress =
    (searchParams.has("code") && searchParams.has("state")) ||
    searchParams.has("error") ||
    searchParams.has("error_description");

  useEffect(() => {
    if (isLoading || !isAuthRedirectInProgress) return;

    const params = new URLSearchParams(location.search || "");
    let changed = false;
    ["code", "state", "error", "error_description"].forEach((key) => {
      if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    });
    if (!changed) return;

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
        hash: location.hash || "",
      },
      { replace: true }
    );
  }, [
    isLoading,
    isAuthRedirectInProgress,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  useEffect(() => {
    if (isLoading || location.pathname !== "/login") return;

    if (isAuthenticated) {
      setLoginModalOpen(false);
      const liveCallbackUrl = getLiveCallbackUrl();
      if (liveCallbackUrl) {
        redirectToLiveCallback(liveCallbackUrl);
        return;
      }

      navigate("/", { replace: true });
      return;
    }

    setLoginModalOpen(true);
  }, [
    getLiveCallbackUrl,
    isAuthenticated,
    isLoading,
    location.pathname,
    navigate,
    redirectToLiveCallback,
  ]);

  useEffect(() => {
    if (isAuthenticated && loginModalOpen) {
      setLoginModalOpen(false);
    }
  }, [isAuthenticated, loginModalOpen]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const resumeState = consumePostLoginResume("live-stream");
    if (resumeState?.targetUrl) {
      redirectToLiveWithToken();
    }
  }, [isAuthenticated, isLoading, redirectToLiveWithToken]);

  useEffect(() => {
    const handleLoginModalRequest = () => {
      if (!isAuthenticated) {
        openLoginRoute();
      }
    };

    window.addEventListener(
      LOGIN_MODAL_REQUEST_EVENT,
      handleLoginModalRequest
    );

    return () => {
      window.removeEventListener(
        LOGIN_MODAL_REQUEST_EVENT,
        handleLoginModalRequest
      );
    };
  }, [isAuthenticated, openLoginRoute]);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const updateHeaderHeight = () => {
      const rect = headerEl.getBoundingClientRect();
      const height = Math.ceil(rect.height);
      document.documentElement.style.setProperty(
        "--header-height",
        `${height}px`
      );
    };

    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerEl);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`relative w-full left-0 right-0 z-40 bg-white ${
        active ? "shadow-md" : "shadow-none"
      }`}
    >
      {/* Top Bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link to={"/"} className="flex items-center gap-x-2">
              <img
                src={logo}
                alt="HB International"
                className="h-11 sm:h-12 md:h-14 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleLiveClick}
                className="hidden h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#e5bd58] px-3 text-sm font-extrabold text-black shadow-[0_8px_20px_rgba(229,189,88,0.2)] transition hover:bg-[#f0cf79] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5bd58] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:opacity-70 md:inline-flex"
                type="button"
                disabled={isLoading || liveRedirecting}
              >
                <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.85)]" />
                </span>
                {t("nav.live")}
              </button>
              <div className="hidden sm:flex items-center gap-2 border border-secondaryRed/80 px-3 py-1 text-sm text-gray-800">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setSelectedCurrency(currency.code)}
                    className={`text-sm font-semibold transition ${
                      selectedCurrency === currency.code
                        ? "text-secondaryRed"
                        : "text-gray-800 hover:text-secondaryRed"
                    }`}
                    aria-pressed={selectedCurrency === currency.code}
                    type="button"
                  >
                    {currency.symbol}
                  </button>
                ))}
              </div>
              <LanguageSwitcher />
              <button
                className="flex h-8 w-8 items-center justify-center text-gray-700 transition hover:text-secondaryRed"
                aria-label={t("common.search")}
                type="button"
                onClick={() => setSearchOverlayOpen(true)}
              >
                <MdSearch size={20} />
              </button>
              <a
                href={`https://wa.me/${normalizeWhatsAppNumber(PRIMARY_CONTACT_PHONE)}`}
                target="_blank"
                rel="noreferrer"
                className="animate-whatsapp-ring flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500 transition hover:bg-emerald-50"
                aria-label="WhatsApp"
                data-whatsapp-url={`https://wa.me/${normalizeWhatsAppNumber(PRIMARY_CONTACT_PHONE)}`}
              >
                <FaWhatsapp size={18} />
              </a>
              {/* Desktop Only - Profile/Login */}
              <div className="hidden lg:flex items-center">
                {isLoading ? (
                  <span className="medium-16">{t("common.loading")}</span>
                ) : !isAuthenticated ? (
                  <button
                    onClick={handleLoginClick}
                    className={
                      "btn-secondary flexCenter gap-x-2 medium-16 rounded-[10px] !bg-[#00A86B] !ring-[#00A86B] hover:!bg-[#009A61]"
                    }
                  >
                    <img
                      src={userIcon}
                      alt=""
                      aria-hidden="true"
                      height={22}
                      width={22}
                    />
                    <span>{t("common.login")}</span>
                  </button>
                ) : (
                  <ProfileMenu user={user} logout={logout} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Row */}
      <div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1">
              <button
                onClick={handleLiveClick}
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#e5bd58] px-3 text-sm font-extrabold text-black shadow-[0_8px_20px_rgba(229,189,88,0.2)] transition hover:bg-[#f0cf79] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5bd58] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:opacity-70 md:hidden"
                type="button"
                disabled={isLoading || liveRedirecting}
              >
                <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.85)]" />
                </span>
                {t("nav.live")}
              </button>
              {/* Desktop Navbar */}
              <Navbar
                containerStyles="hidden lg:flex items-center gap-6 text-[13px] font-semibold"
                onContactClick={() => setContactModalOpen(true)}
                closeMenu={() => {}}
                currencies={currencies}
                selectedCurrency={selectedCurrency}
                onCurrencySelect={setSelectedCurrency}
              />
            </div>

            <div className="flex items-center gap-3">
              {!menuOpened ? (
                <MdMenu
                  className="lg:hidden cursor-pointer text-3xl hover:text-secondary"
                  onClick={toggleMenu}
                />
              ) : (
                <MdClose
                  className="lg:hidden cursor-pointer text-3xl hover:text-secondary"
                  onClick={toggleMenu}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ease-out lg:hidden ${
          menuOpened ? "translate-x-0" : "-translate-x-full"
        } ${menuOpened ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpened}
      >
        <div className="flex h-16 items-center justify-end border-b border-gray-200 px-5">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-secondaryRed"
          >
            <MdArrowBack size={20} />
            <span>{t("common.back")}</span>
          </button>
        </div>
        <div className="h-[calc(100dvh-4rem)] overflow-y-auto px-2 pb-6">
          <Navbar
            containerStyles="flex w-full flex-col"
            onContactClick={() => {
              setMenuOpened(false);
              setContactModalOpen(true);
            }}
            closeMenu={() => setMenuOpened(false)}
            isMobile={true}
            isAuthenticated={isAuthenticated}
            user={user}
            logout={logout}
            isLoading={isLoading}
            onLoginClick={() => {
              setMenuOpened(false);
              handleLoginClick();
            }}
            onProfileClick={() => {
              setMenuOpened(false);
              setProfileModalOpen(true);
            }}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            onCurrencySelect={setSelectedCurrency}
          />
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleLoginModalClose}
      />

      {/* Contact Modal */}
      <ContactModal
        opened={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        opened={profileModalOpen}
        setOpened={setProfileModalOpen}
      />

      {searchOverlayOpen && (
        <SearchOverlay
          isOpen={searchOverlayOpen}
          onClose={() => setSearchOverlayOpen(false)}
        />
      )}

    </header>
  );
};

export default Header;
