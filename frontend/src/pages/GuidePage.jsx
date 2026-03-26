import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import SeoStaticPageLayout from "../components/SeoStaticPageLayout";
import { getGuidePageBySlug } from "../data/contentHubPages";

const GuidePage = ({ slug: explicitSlug }) => {
  const params = useParams();
  const slug = explicitSlug || params.slug || "";
  const page = getGuidePageBySlug(slug);

  if (!page) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] pt-28">
        <div className="max-padd-container">
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_24px_60px_-45px_rgba(15,23,42,0.45)]">
            <h1 className="text-3xl font-bold text-slate-900">Guide not found</h1>
            <p className="mt-3 text-slate-600">
              This guide is not available yet.
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

