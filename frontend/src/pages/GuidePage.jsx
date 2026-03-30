import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SeoStaticPageLayout from "../components/SeoStaticPageLayout";
import { getGuidePageBySlug } from "../data/contentHubPages";
import { normalizeLanguageCode } from "../utils/languageRouting";

const GuidePage = ({ slug: explicitSlug }) => {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const slug = explicitSlug || params.slug || "";
  const language = normalizeLanguageCode(i18n.language);
  const page = getGuidePageBySlug(slug, language);

  if (!page) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] pt-28">
        <div className="max-padd-container">
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_24px_60px_-45px_rgba(15,23,42,0.45)]">
            <h1 className="text-3xl font-bold text-slate-900">
              {t("guidePage.notFoundTitle", "Guide not found")}
            </h1>
            <p className="mt-3 text-slate-600">
              {t("guidePage.notFoundText", "This guide is not available yet.")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <SeoStaticPageLayout {...page} />;
};

GuidePage.propTypes = {
  slug: PropTypes.string,
};

export default GuidePage;
