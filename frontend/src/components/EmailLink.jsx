import PropTypes from "prop-types";
import { useAuth0 } from "@auth0/auth0-react";
import { buildEmailHref } from "../utils/common";
import { requestLoginModal } from "../utils/loginPrompt";

const EmailLink = ({
  email,
  children,
  className,
  onClick,
  requireAuth = true,
  ...rest
}) => {
  const { isAuthenticated } = useAuth0();

  if (!email) return null;

  const href = buildEmailHref(email);

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (requireAuth && !isAuthenticated) {
      event.preventDefault();
      requestLoginModal({ source: "email_link" });
    }
  };

  if (!href) {
    return (
      <span className={className} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};

EmailLink.propTypes = {
  email: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  requireAuth: PropTypes.bool,
};

export default EmailLink;
