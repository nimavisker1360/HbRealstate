import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { DEFAULT_SEO, buildLanguageAlternates, toAbsoluteUrl } from "../utils/seo";

const SEO = ({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  robots = "index, follow",
  structuredData = [],
  languageAlternates,
  locale,
  localeAlternates,
}) => {
  const location = useLocation();
  const resolvedTitle = title || DEFAULT_SEO.title;
  const resolvedDescription = description || DEFAULT_SEO.description;
  const canonicalUrl = toAbsoluteUrl(canonicalPath || location.pathname);
  const imageUrl = toAbsoluteUrl(image || DEFAULT_SEO.image);
  const resolvedAlternates =
    Array.isArray(languageAlternates) && languageAlternates.length > 0
      ? languageAlternates
      : buildLanguageAlternates(canonicalPath || location.pathname);
  const resolvedLocale = locale || DEFAULT_SEO.locale;
  const resolvedLocaleAlternates =
    Array.isArray(localeAlternates) && localeAlternates.length > 0
      ? localeAlternates
      : DEFAULT_SEO.localeAlternates;

  return (
    <Helmet prioritizeSeoTags>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={robots} />

      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={resolvedTitle} />
      <meta property="og:locale" content={resolvedLocale} />
      {resolvedLocaleAlternates
        .filter(Boolean)
        .map((item) => (
          <meta key={item} property="og:locale:alternate" content={item} />
        ))}

      <meta name="twitter:card" content={DEFAULT_SEO.twitterCard} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {resolvedAlternates
        .filter((item) => item?.hrefLang && item?.href)
        .map((item) => (
          <link
            key={`${item.hrefLang}-${item.href}`}
            rel="alternate"
            hrefLang={item.hrefLang}
            href={item.href}
          />
        ))}

      {structuredData
        .filter(Boolean)
        .map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonicalPath: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  robots: PropTypes.string,
  structuredData: PropTypes.arrayOf(PropTypes.object),
  languageAlternates: PropTypes.arrayOf(
    PropTypes.shape({
      hrefLang: PropTypes.string,
      href: PropTypes.string,
    })
  ),
  locale: PropTypes.string,
  localeAlternates: PropTypes.arrayOf(PropTypes.string),
};

export default SEO;
