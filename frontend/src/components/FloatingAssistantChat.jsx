import { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { MdClose, MdPerson, MdRefresh, MdSend } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import UserDetailContext from "../context/UserDetailContext";
import aiRobotAvatar from "../assets/ai-robot-avatar.svg";
import { chatWithRealEstateAssistant, getUserProfile } from "../utils/api";
import { normalizeWhatsAppNumber } from "../utils/common";
import { resolveBlogPath, resolvePropertyPath } from "../utils/seo";

const UI_TEXT = {
  en: {
    title: "AI Property Assistant",
    subtitle: "Ask about budget, rooms, location or payment plans.",
    placeholder: "Example: 2+1 in Istanbul under 200000 USD",
    send: "Send",
    sending: "Sending...",
    empty: "No messages yet.",
    error: "Assistant is temporarily unavailable. Please try again.",
    close: "Close",
    ask: "Ask a question",
    noPrice: "Price on request",
    rooms: "Rooms",
    size: "Size",
    delivery: "Delivery",
    viewProject: "View project",
    projectLink: "Project link",
    newChat: "New chat",
    consultantProfile: "Consultant profile",
    consultantLanguages: "Languages",
    consultantRating: "Rating",
    consultantExperience: "Experience",
    consultantEmail: "Email",
    consultantWhatsApp: "WhatsApp",
    viewBlog: "Read blog",
    blogLink: "Blog link",
    blogCategory: "Category",
    blogCountry: "Country",
    userAvatar: "User",
    assistantAvatar: "AI Assistant",
  },
  tr: {
    title: "AI Emlak Asistani",
    subtitle: "Butce, oda tipi, lokasyon veya odeme plani sorun.",
    placeholder: "Ornek: Istanbul'da 200000 USD alti 2+1",
    send: "Gonder",
    sending: "Gonderiliyor...",
    empty: "Henuz mesaj yok.",
    error: "Asistan su anda kullanilamiyor. Lutfen tekrar deneyin.",
    close: "Kapat",
    ask: "Soru sor",
    noPrice: "Fiyat icin iletisime gecin",
    rooms: "Oda",
    size: "Alan",
    delivery: "Teslim",
    viewProject: "Projeyi gor",
    projectLink: "Proje linki",
    newChat: "Yeni sohbet",
    consultantProfile: "Danisman profili",
    consultantLanguages: "Diller",
    consultantRating: "Puan",
    consultantExperience: "Deneyim",
    consultantEmail: "E-posta",
    consultantWhatsApp: "WhatsApp",
    viewBlog: "Blogu oku",
    blogLink: "Blog linki",
    blogCategory: "Kategori",
    blogCountry: "Ulke",
    userAvatar: "Kullanici",
    assistantAvatar: "AI Asistan",
  },
  ru: {
    title: "AI Assistant po Nedvizhimosti",
    subtitle: "Sprosite pro byudzhet, komnaty, rayon ili rassrochku.",
    placeholder: "Primer: 2+1 v Stambule do 200000 USD",
    send: "Otpravit",
    sending: "Otpravlyaetsya...",
    empty: "Soobshcheniy poka net.",
    error: "Assistant vremenno nedostupen. Poprobuyte snova.",
    close: "Zakryt",
    ask: "Zadaite vopros",
    noPrice: "Tsena po zaprosu",
    rooms: "Komnaty",
    size: "Ploshchad",
    delivery: "Srok sdachi",
    viewProject: "Otkryt proekt",
    projectLink: "Ssylka na proekt",
    newChat: "Novyy chat",
    consultantProfile: "Profil konsultanta",
    consultantLanguages: "Yazyki",
    consultantRating: "Reyting",
    consultantExperience: "Opyt",
    consultantEmail: "Email",
    consultantWhatsApp: "WhatsApp",
    viewBlog: "Chitat blog",
    blogLink: "Ssylka na blog",
    blogCategory: "Kategoriya",
    blogCountry: "Strana",
    userAvatar: "Polzovatel",
    assistantAvatar: "AI Assistant",
  },
};

const detectUiLang = (lang) => {
  const normalized = String(lang || "").toLowerCase();
  if (normalized.startsWith("tr")) return "tr";
  if (normalized.startsWith("ru")) return "ru";
  return "en";
};

const formatPrice = (priceUsd, priceTry, labels) => {
  const usd = Number(priceUsd) || 0;
  const tr = Number(priceTry) || 0;
  if (usd > 0) return `$${usd.toLocaleString()}`;
  if (tr > 0) return `${tr.toLocaleString()} TRY`;
  return labels.noPrice;
};

const serializeHistory = (messages) =>
  messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({ role: msg.role, content: msg.content }));

const resolveDetailUrl = (item) => {
  const link = String(item?.detail_url || "").trim();
  if (link) return link;
  const slug = String(item?.slug || item?.seoSlug || "").trim();
  const id = String(item?.id || "").trim();
  if (!slug && !id) return "";
  return resolvePropertyPath({ slug, id });
};

const resolveAbsoluteUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
};

const resolveConsultantProfileUrl = (item) => {
  const link = String(item?.profile_url || "").trim();
  if (link) return link;
  return "/consultants";
};

const resolveBlogUrl = (item) => {
  const link = String(item?.blog_url || "").trim();
  if (link) return link;
  const path = resolveBlogPath(item, { preferSlug: true });
  return path === "/blogs" ? "" : path;
};

const FloatingAssistantChat = () => {
  const { i18n } = useTranslation();
  const { user: auth0User, isAuthenticated } = useAuth0();
  const { userDetails } = useContext(UserDetailContext);
  const token = userDetails?.token;
  const profileImageFromContext = String(userDetails?.profile?.image || "").trim();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState("");
  const endRef = useRef(null);

  const uiLang = detectUiLang(i18n.language);
  const labels = useMemo(() => UI_TEXT[uiLang] || UI_TEXT.en, [uiLang]);
  const userAvatarSrc = useMemo(
    () =>
      String(
        userProfileImage || profileImageFromContext || auth0User?.picture || ""
      ).trim(),
    [auth0User?.picture, profileImageFromContext, userProfileImage]
  );

  useEffect(() => {
    let active = true;
    if (profileImageFromContext) {
      setUserProfileImage(profileImageFromContext);
    }
    const loadUserProfileImage = async () => {
      if (!isOpen || !isAuthenticated || !auth0User?.email || !token) return;
      const profileData = await getUserProfile(auth0User.email, token);
      const image = String(profileData?.image || "").trim();
      if (active && image) {
        setUserProfileImage(image);
      }
    };
    loadUserProfileImage();
    return () => { active = false; };
  }, [auth0User?.email, isAuthenticated, isOpen, profileImageFromContext, token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const nextMessages = [
      ...messages,
      { role: "user", content: prompt, results: [], consultants: [], blogs: [] },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await chatWithRealEstateAssistant(
        prompt,
        serializeHistory(nextMessages)
      );
      const chunks = [response?.reply, response?.next_question, response?.lead_prompt]
        .map((v) => String(v || "").trim())
        .filter(Boolean);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: chunks.join("\n\n"),
          results: Array.isArray(response?.results) ? response.results : [],
          consultants: Array.isArray(response?.consultants) ? response.consultants : [],
          blogs: Array.isArray(response?.blogs) ? response.blogs : [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: labels.error,
          results: [],
          consultants: [],
          blogs: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <>
      {/* Overlay backdrop when panel is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating chat panel */}
      <div
        className={`floating-chat-panel fixed bottom-24 right-4 z-[9999] w-[440px] max-w-[calc(100vw-2rem)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-[120%] opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <div className="ai-chat-shell flex h-[600px] max-h-[75vh] flex-col overflow-hidden rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-4 py-3">
            <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/35 blur-2xl" />
            <div className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-teal-200/40 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 shadow-sm">
                  <img
                    src={aiRobotAvatar}
                    alt="AI"
                    className="h-7 w-7"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-gray-900">
                      {labels.title}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      AI
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">{labels.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-emerald-100 hover:text-gray-600"
                aria-label={labels.close}
              >
                <MdClose size={20} />
              </button>
            </div>
          </div>

          {/* Chat body */}
          <div className="ai-chat-body flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="mx-auto mt-4 max-w-[320px] rounded-xl border border-dashed border-emerald-200 bg-white/95 px-4 py-6 text-center text-sm text-gray-600">
                {labels.ask}
              </div>
            ) : (
              <div className="space-y-2.5">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      style={{ animationDelay: `${Math.min(index * 45, 220)}ms` }}
                    >
                      <div
                        className={`flex max-w-[96%] items-end gap-1.5 ${
                          isUser ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm shadow-sm ${
                            isUser
                              ? "border-emerald-200 bg-white text-emerald-600"
                              : "border-emerald-500 bg-emerald-50 text-emerald-600"
                          }`}
                          title={isUser ? labels.userAvatar : labels.assistantAvatar}
                        >
                          {isUser ? (
                            userAvatarSrc ? (
                              <img
                                src={userAvatarSrc}
                                alt={labels.userAvatar}
                                className="h-full w-full rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <MdPerson size={15} />
                            )
                          ) : (
                            <img
                              src={aiRobotAvatar}
                              alt={labels.assistantAvatar}
                              className="h-full w-full rounded-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div
                          className={`ai-chat-bubble max-w-[88%] px-3 py-2.5 text-[13px] leading-relaxed ${
                            isUser ? "ai-chat-bubble-user" : "ai-chat-bubble-assistant"
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.content || labels.empty}</div>

                          {!isUser && Array.isArray(msg.results) && msg.results.length > 0 && (
                            <div className="mt-2.5 space-y-2.5">
                              {msg.results.map((item) => (
                                <div
                                  key={item.id}
                                  className="ai-chat-result-card overflow-hidden rounded-xl border border-emerald-100 bg-white"
                                >
                                  {item.image_url ? (
                                    <div className="relative overflow-hidden">
                                      <img
                                        src={item.image_url}
                                        alt={item.title || "project"}
                                        className="h-36 w-full object-cover"
                                        loading="lazy"
                                      />
                                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                                    </div>
                                  ) : null}
                                  <div className="space-y-1.5 p-2.5">
                                    <p className="text-[13px] font-semibold text-gray-900">
                                      {item.title}
                                    </p>
                                    <p className="text-[11px] text-gray-600">
                                      {[item.city, item.district].filter(Boolean).join(" - ")}
                                    </p>
                                    <p className="text-[13px] font-semibold text-emerald-600">
                                      {formatPrice(item.price_usd, item.price_try, labels)}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-600">
                                      {item.rooms ? <span>{labels.rooms}: {item.rooms}</span> : null}
                                      {item.size_m2 ? <span>{labels.size}: {item.size_m2} m2</span> : null}
                                      {item.delivery_date ? <span>{labels.delivery}: {item.delivery_date}</span> : null}
                                    </div>
                                    {resolveDetailUrl(item) ? (
                                      <div className="space-y-0.5 pt-1">
                                        <a
                                          href={resolveDetailUrl(item)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ai-chat-link-btn inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
                                        >
                                          {labels.viewProject}
                                        </a>
                                        <p className="break-all text-[10px] text-gray-500">
                                          {labels.projectLink}: {resolveAbsoluteUrl(resolveDetailUrl(item))}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!isUser && Array.isArray(msg.blogs) && msg.blogs.length > 0 && (
                            <div className="mt-2.5 space-y-2.5">
                              {msg.blogs.map((blog, blogIndex) => {
                                const blogUrl = resolveBlogUrl(blog);
                                return (
                                  <div
                                    key={`${blog.id || blog.title || "blog"}-${blogIndex}`}
                                    className="ai-chat-result-card overflow-hidden rounded-xl border border-emerald-100 bg-white"
                                  >
                                    {blog.image_url ? (
                                      <div className="relative overflow-hidden">
                                        <img
                                          src={blog.image_url}
                                          alt={blog.title || "blog"}
                                          className="h-32 w-full object-cover"
                                          loading="lazy"
                                        />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                      </div>
                                    ) : null}
                                    <div className="space-y-1.5 p-2.5">
                                      <p className="text-[13px] font-semibold text-gray-900">
                                        {blog.title}
                                      </p>
                                      {blog.summary ? (
                                        <p className="line-clamp-3 text-[11px] text-gray-600">
                                          {blog.summary}
                                        </p>
                                      ) : null}
                                      <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-600">
                                        {blog.category ? (
                                          <span>{labels.blogCategory}: {blog.category}</span>
                                        ) : null}
                                        {blog.country ? (
                                          <span>{labels.blogCountry}: {blog.country}</span>
                                        ) : null}
                                      </div>
                                      {blogUrl ? (
                                        <div className="space-y-0.5 pt-1">
                                          <a
                                            href={blogUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="ai-chat-link-btn inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
                                          >
                                            {labels.viewBlog}
                                          </a>
                                          <p className="break-all text-[10px] text-gray-500">
                                            {labels.blogLink}: {resolveAbsoluteUrl(blogUrl)}
                                          </p>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {!isUser &&
                            Array.isArray(msg.consultants) &&
                            msg.consultants.length > 0 && (
                              <div className="mt-2.5 space-y-2.5">
                                {msg.consultants.map((consultant, consultantIndex) => {
                                  const whatsappNumber = normalizeWhatsAppNumber(
                                    consultant?.whatsapp
                                  );
                                  const profileUrl = resolveConsultantProfileUrl(consultant);
                                  return (
                                    <div
                                      key={`${consultant.id || consultant.email || "consultant"}-${consultantIndex}`}
                                      className="ai-chat-result-card overflow-hidden rounded-xl border border-emerald-100 bg-white"
                                    >
                                      <div className="flex items-start gap-2.5 p-2.5">
                                        <img
                                          src={
                                            consultant.image_url ||
                                            "https://via.placeholder.com/120x120?text=Consultant"
                                          }
                                          alt={consultant.name || "consultant"}
                                          className="h-14 w-14 rounded-lg object-cover"
                                          loading="lazy"
                                        />
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <p className="truncate text-[13px] font-semibold text-gray-900">
                                            {consultant.name || labels.consultantProfile}
                                          </p>
                                          {consultant.title ? (
                                            <p className="text-[11px] text-gray-600">{consultant.title}</p>
                                          ) : null}
                                          {consultant.specialty ? (
                                            <p className="text-[11px] text-gray-500">{consultant.specialty}</p>
                                          ) : null}
                                          <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-600">
                                            {consultant.rating ? (
                                              <span>{labels.consultantRating}: {consultant.rating}</span>
                                            ) : null}
                                            {consultant.experience ? (
                                              <span>{labels.consultantExperience}: {consultant.experience}</span>
                                            ) : null}
                                            {Array.isArray(consultant.languages) &&
                                            consultant.languages.length > 0 ? (
                                              <span>
                                                {labels.consultantLanguages}: {consultant.languages.join(", ")}
                                              </span>
                                            ) : null}
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {whatsappNumber ? (
                                              <a
                                                href={`https://wa.me/${whatsappNumber}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="ai-chat-link-btn inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
                                              >
                                                {labels.consultantWhatsApp}
                                              </a>
                                            ) : null}
                                            {consultant.email ? (
                                              <a
                                                href={`mailto:${consultant.email}`}
                                                className="inline-flex rounded-lg border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                              >
                                                {labels.consultantEmail}
                                              </a>
                                            ) : null}
                                            {profileUrl ? (
                                              <a
                                                href={profileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex rounded-lg border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                              >
                                                {labels.consultantProfile}
                                              </a>
                                            ) : null}
                                          </div>
                                          {profileUrl ? (
                                            <p className="break-all text-[10px] text-gray-500">
                                              {resolveAbsoluteUrl(profileUrl)}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-1.5">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm"
                        title={labels.assistantAvatar}
                      >
                        <img
                          src={aiRobotAvatar}
                          alt={labels.assistantAvatar}
                          className="h-full w-full rounded-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="ai-chat-bubble ai-chat-bubble-assistant max-w-[180px] px-3 py-2.5">
                        <div className="ai-chat-typing">
                          <span />
                          <span />
                          <span />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500">{labels.sending}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-emerald-100/80 bg-white/95 px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKeyDown}
                className="min-h-[40px] max-h-24 flex-1 resize-none rounded-xl border border-emerald-200 bg-emerald-50/35 px-3 py-2 text-[13px] text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder={labels.placeholder}
                rows={1}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MdSend size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`floating-chat-btn fixed bottom-6 right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 ${
          isOpen ? "" : "animate-whatsapp-ring"
        }`}
        aria-label={labels.title}
      >
        <img
          src={aiRobotAvatar}
          alt="AI Assistant"
          className={`h-8 w-8 rounded-full ${isOpen ? "" : "animate-robot-shake"}`}
        />
      </button>
    </>
  );
};

export default FloatingAssistantChat;
