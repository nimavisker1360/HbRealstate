import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "./Navbar";
import { MdClose, MdMenu } from "react-icons/md";
import userIcon from "../assets/user.svg";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import ProfileMenu from "./ProfileMenu";
import LoginModal from "./LoginModal";
import ContactModal from "./ContactModal";
import ProfileModal from "./ProfileModal";
import LanguageSwitcher from "./LanguageSwitcher";
import logo from "../assets/logo.png";

const Header = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const autoLoginTriggeredRef = useRef(false);
  const loginPromptTimerRef = useRef(null);
  const toggleMenu = () => setMenuOpened(!menuOpened);
  const { isAuthenticated, user, logout, isLoading } = useAuth0();
  const prevAuthRef = useRef(isAuthenticated);

  const handleLoginClick = () => {
    setLoginModalOpen(true);
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

  const scheduleLoginPrompt = useCallback(() => {
    if (loginPromptTimerRef.current) return;
    loginPromptTimerRef.current = setTimeout(() => {
      loginPromptTimerRef.current = null;
      autoLoginTriggeredRef.current = true;
      setLoginModalOpen(true);
    }, 180);
  }, []);

  useEffect(() => {
    if (autoLoginTriggeredRef.current) return;
    if (isLoading) return;
    if (!isAuthenticated) {
      scheduleLoginPrompt();
      return;
    }
    autoLoginTriggeredRef.current = true;
  }, [isAuthenticated, isLoading, scheduleLoginPrompt]);

  useEffect(() => {
    if (isLoading) return;
    const wasAuthenticated = prevAuthRef.current;
    if (wasAuthenticated && !isAuthenticated) {
      scheduleLoginPrompt();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading, scheduleLoginPrompt]);

  useEffect(() => {
    return () => {
      if (loginPromptTimerRef.current) {
        clearTimeout(loginPromptTimerRef.current);
        loginPromptTimerRef.current = null;
      }
    };
  }, []);

  return (
    <header className="fixed top-1 w-full left-0 right-0 z-50 px-4 sm:px-6 lg:px-12">
      {/* container */}
      <div
        className={`${
          active ? "py-0 " : " py-1"
        } max-w-[1440px] mx-auto bg-white transition-all duration-200 rounded-full px-4 sm:px-5 ring-1 ring-slate-900/5`}
      >
        <div className="flexBetween py-3 ">
          {/* logo */}
          <Link to={"/"} className="flex items-center gap-x-2">
            <img
              src={logo}
              alt="HB International"
              className="h-10 sm:h-12 md:h-14 object-contain"
            />
          </Link>
          {/* Navbar */}
          <div className="flexCenter gap-x-4">
            {/* Desktop Navbar */}
            <Navbar
              containerStyles={
                "hidden lg:flex gap-x-5 lg:gap-x-10 capitalize medium-15 ring-1 ring-slate-900/10 rounded-full p-2 bg-primary"
              }
              onContactClick={() => setContactModalOpen(true)}
              closeMenu={() => {}}
            />

            {/* Mobile Navbar */}
            <Navbar
              containerStyles={`${
                menuOpened
                  ? "flex lg:hidden items-start flex-col gap-y-2 capitalize fixed top-20 right-4 sm:right-8 p-4 sm:p-6 bg-white rounded-3xl shadow-md w-56 sm:w-64 medium-16 ring-1 ring-slate-900/5 transition-all duration-300 z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
                  : "flex lg:hidden items-start flex-col gap-y-2 fixed top-20 p-6 bg-white rounded-3xl shadow-md w-64 medium-16 ring-1 ring-slate-900/5 transition-all duration-300 right-[-300px] invisible opacity-0"
              }`}
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
            />
          </div>
          {/* buttons */}
          <div className="flexBetween gap-x-3 sm:gap-x-5 bold-16">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
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
            {/* Desktop Only - Profile/Login */}
            <div className="hidden lg:block">
              {isLoading ? (
                <span className="medium-16">{t('common.loading')}</span>
              ) : !isAuthenticated ? (
                <button
                  onClick={handleLoginClick}
                  className={
                    "btn-secondary flexCenter gap-x-2 medium-16 rounded-full"
                  }
                >
                  <img src={userIcon} alt="" height={22} width={22} />
                  <span>{t('common.login')}</span>
                </button>
              ) : (
                <ProfileMenu user={user} logout={logout} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
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
    </header>
  );
};

export default Header;
