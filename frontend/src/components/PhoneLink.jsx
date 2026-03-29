import PropTypes from "prop-types";
import { useAuth0 } from "@auth0/auth0-react";
import { buildTelHref } from "../utils/common";
import { requestLoginModal } from "../utils/loginPrompt";

/**
 * Renders a semantic <a href="tel:..."> for GTM click-to-call tracking.
 * Returns null when no phone value is provided, and falls back to a
 * non-clickable <span> if the value cannot be normalised to a valid tel: href.
 */
const PhoneLink = ({
  phone,
  children,
  className,
  onClick,
  requireAuth = true,
  ...rest
}) => {
  const { isAuthenticated } = useAuth0();

  if (!phone) return null;

  const href = buildTelHref(phone);

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (requireAuth && !isAuthenticated) {
      event.preventDefault();
      requestLoginModal({ source: "phone_link" });
    }
  };

  if (!href) {
    return (
      <span className={className} onClick={onClick} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={`phone-click-link ${className || ""}`.trim()}
      data-contact-type="phone"
      data-track="click-to-call"
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
};

PhoneLink.propTypes = {
  phone: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  requireAuth: PropTypes.bool,
};

export default PhoneLink;
