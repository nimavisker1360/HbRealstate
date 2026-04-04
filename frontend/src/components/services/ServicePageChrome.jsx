import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../SEO";

const ServicePageChrome = ({
  title,
  description,
  canonicalPath,
  structuredData = [],
  breadcrumbItems,
  children,
}) => {
  const { t } = useTranslation();
  const items =
    breadcrumbItems || [
      { label: t("services.breadcrumb.home"), to: "/" },
      { label: t("services.breadcrumb.services"), to: "/services" },
    ];

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        type="website"
        structuredData={structuredData.filter(Boolean)}
      />
      <div className="hb-services-theme min-h-screen bg-[#1e2a38] pb-16 pt-24">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <nav
            className="text-sm text-white/60 mb-6 flex flex-wrap gap-2 items-center"
            aria-label="Breadcrumb"
          >
            {items.map((item, i) => (
              <span key={`${item.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {item.to ? (
                  <Link to={item.to} className="hover:text-[#06a84e] transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white/90 font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </>
  );
};

ServicePageChrome.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  canonicalPath: PropTypes.string.isRequired,
  structuredData: PropTypes.array,
  breadcrumbItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    })
  ),
  children: PropTypes.node.isRequired,
};

export default ServicePageChrome;
