const faq = (entries) =>
  entries.map(([question, answer]) => ({ question, answer }));

const cta = (title, description, primaryLabel, primaryTo, secondaryLabel, secondaryTo) => ({
  title,
  description,
  primaryAction: { label: primaryLabel, to: primaryTo },
  secondaryAction:
    secondaryLabel && secondaryTo
      ? { label: secondaryLabel, to: secondaryTo }
      : null,
});

const marketPack = (lead, city) => ({
  introParagraphs: [
    `${lead} Buyers usually get better outcomes when they compare districts, operating costs, and exit liquidity before they compare brochure features.`,
    `In ${city || "this market"}, supply pressure, transport access, and tenant depth matter more than generic promises. The right page should connect strategy, due diligence, and shortlist logic.`,
  ],
  sections: [
    {
      heading: "How To Evaluate The Market",
      paragraphs: [
        "Start with objective, budget band, and intended hold period. That usually narrows the district and property-type set faster than broad listing searches.",
        "Compare demand depth against new supply. Strong markets still underperform when comparable inventory is building too fast.",
      ],
    },
    {
      heading: "How To Execute Safely",
      paragraphs: [
        "Shortlists improve when legal review, valuation logic, and recurring ownership cost are treated as part of the buying decision rather than final-stage admin.",
        "The best opportunities are usually the assets that remain coherent on rentability, livability, documentation, and future resale all at once.",
      ],
    },
  ],
});

const page = ({
  slug,
  title,
  seoTitle,
  description,
  breadcrumbLabel,
  pageType,
  taxonomy,
  highlights,
  relatedLinks,
  introParagraphs,
  sections,
  faqs,
  ctaSection,
  ...rest
}) => ({
  ...rest,
  slug,
  title,
  seoTitle: seoTitle || title,
  description,
  canonicalPath: `/${slug}`,
  breadcrumbLabel,
  pageType,
  contentType: pageType,
  taxonomy,
  highlights,
  relatedLinks,
  introParagraphs,
  sections,
  faqs,
  cta: ctaSection,
});

const istanbulPack = marketPack("Buying property in Istanbul is usually won or lost at district level, not at brochure level.", "Istanbul");
const turkeyPack = marketPack("Turkey real estate investment requires stronger submarket comparison than most listing-led sites provide.", "Turkey");
const citizenshipPack = marketPack("Citizenship-led buying needs compliance discipline as well as investment discipline.", "Turkey");

export const contentHubPages = [
  page({
    slug: "istanbul-apartments",
    title: "Istanbul Apartments: Complete Buyer and Investor Guide",
    description: "Discover where, when, and how to buy Istanbul apartments with practical guidance on districts, yields, legal checks, and long-term value.",
    breadcrumbLabel: "Istanbul Apartments",
    pageType: "city page",
    taxonomy: { contentType: "city page", category: "istanbul properties", city: "Istanbul", country: "Turkey", tags: ["apartments", "istanbul"], intents: ["investment", "rental-income", "family-living"] },
    highlights: ["District selection matters more than listing volume.", "Transport and tenant depth usually beat hype.", "Ready and off-plan stock should be evaluated separately."],
    relatedLinks: [
      { to: "/listing?search=Istanbul", label: "Istanbul Listings" },
      { to: "/projects?projectType=local", label: "Local Projects" },
      { to: "/buy-property-in-istanbul", label: "Buying Guide" },
    ],
    introParagraphs: istanbulPack.introParagraphs,
    sections: istanbulPack.sections,
    faqs: faq([
      ["Which Istanbul districts usually hold demand best?", "Districts with broad tenant profiles, good transport, and controlled new supply usually remain more resilient."],
      ["Are ready properties safer than off-plan in Istanbul?", "Ready stock gives clearer evidence. Off-plan can work, but it needs tighter developer and delivery review."],
      ["Should small units always be prioritised?", "Not automatically. Unit size should match district demand and resale depth."],
    ]),
    ctaSection: cta("Shortlist Istanbul opportunities with stronger filters", "Compare districts, projects, and citizenship or installment options before you book viewings.", "Browse Istanbul listings", "/listing?search=Istanbul", "Talk to an advisor", "/consultants"),
  }),
  page({
    slug: "kyrenia-apartments",
    title: "Kyrenia Apartments: A Practical Guide For Buyers And Investors",
    description: "Learn how to evaluate Kyrenia apartments with a data-led approach covering rental demand, project quality, legal checks, and long-term exit planning.",
    breadcrumbLabel: "Kyrenia Apartments",
    pageType: "city page",
    taxonomy: { contentType: "city page", category: "regional market guides", city: "Kyrenia", country: "Cyprus", tags: ["kyrenia", "cyprus"], intents: ["investment", "rental-income", "lifestyle"] },
    highlights: ["Coastal pricing needs net-income discipline.", "Maintenance and service charge drag matter.", "Exit liquidity should be priced in from the start."],
    relatedLinks: [
      { to: "/listing?search=Kyrenia", label: "Kyrenia Listings" },
      { to: "/cyprus-property-guide", label: "Cyprus Guide" },
      { to: "/projects?projectType=international", label: "International Projects" },
    ],
    introParagraphs: marketPack("Kyrenia works best when buyers compare lifestyle value and ownership friction together.", "Kyrenia").introParagraphs,
    sections: marketPack("Kyrenia works best when buyers compare lifestyle value and ownership friction together.", "Kyrenia").sections,
    faqs: faq([
      ["Are Kyrenia apartments better for lifestyle or investment?", "They can work for both, but only if pricing, management quality, and demand assumptions are realistic."],
      ["What is the biggest mistake in coastal projects?", "Ignoring dues and maintenance drag while focusing only on views and headline rents."],
      ["Can remote ownership work in Kyrenia?", "Yes, but it depends heavily on reliable local management and clean documentation."],
    ]),
    ctaSection: cta("Compare coastal stock with other regional options", "Review Cyprus opportunities alongside international projects instead of treating them as isolated choices.", "View Cyprus listings", "/listing?search=Kyrenia", "See international projects", "/projects?projectType=international"),
  }),
  page({
    slug: "turkey-property-investment",
    title: "Turkey Property Investment: Strategy, Risk, And Return Framework",
    description: "Build a stronger Turkey property investment strategy with practical guidance on market selection, due diligence, financing, and long-term portfolio management.",
    breadcrumbLabel: "Turkey Property Investment",
    pageType: "pillar page",
    taxonomy: { contentType: "pillar page", category: "turkey investment guides", country: "Turkey", tags: ["investment", "portfolio"], intents: ["investment", "rental-income", "legal-tax"] },
    highlights: ["Choose submarkets before choosing listings.", "Model net return, not brochure yield.", "Build every purchase with an exit thesis."],
    relatedLinks: [
      { to: "/property-investment-in-antalya", label: "Antalya Guide" },
      { to: "/best-areas-in-istanbul-for-investment", label: "Best Istanbul Areas" },
      { to: "/listing", label: "All Listings" },
    ],
    introParagraphs: turkeyPack.introParagraphs,
    sections: turkeyPack.sections,
    faqs: faq([
      ["Is Turkey suitable for long-term property investors?", "Yes, when acquisitions are based on district-level fundamentals, disciplined underwriting, and clean execution."],
      ["What should investors compare first across cities?", "Demand depth, supply pressure, liquidity, and real ownership cost."],
      ["Should one city be chosen immediately?", "Usually no. Comparing two or three relevant submarkets improves pricing discipline."],
    ]),
    ctaSection: cta("Build a shortlist around strategy, not random inventory", "Start with intent, city, citizenship needs, and payment-plan preference before you compare individual listings.", "Explore listings", "/listing", "Request investment advice", "/consultants"),
  }),
  page({
    slug: "turkish-citizenship-property",
    title: "Turkish Citizenship By Property: A Clear Investor Playbook",
    title_tr: "Gayrimenkul ile Türk Vatandaşlığı: Yatırımcı İçin Net Bir Yol Haritası",
    title_ru: "Турецкое гражданство через недвижимость: чёткий путеводитель для инвестора",
    description: "Understand how to approach Turkish citizenship by property with a practical framework for eligibility, due diligence, and long-term asset performance.",
    description_tr:
      "Gayrimenkul yoluyla Türk vatandaşlığına, uygunluk, durum tespiti ve varlığın uzun vadeli performansını kapsayan pratik bir çerçeveyle nasıl yaklaşmanız gerektiğini anlayın.",
    description_ru:
      "Поймите, как подходить к получению турецкого гражданства через недвижимость с практичной схемой оценки соответствия требованиям, due diligence и долгосрочного качества актива.",
    breadcrumbLabel: "Turkish Citizenship Property",
    breadcrumbLabel_tr: "Gayrimenkul ile Türk Vatandaşlığı",
    breadcrumbLabel_ru: "Гражданство через недвижимость",
    pageType: "pillar page",
    taxonomy: { contentType: "pillar page", category: "turkish citizenship", country: "Turkey", tags: ["citizenship", "compliance"], intents: ["citizenship", "investment", "legal-tax"], citizenship: true },
    highlights: ["Compliance quality matters more than claims.", "Citizenship-led deals should still be good investments.", "Valuation and payment traceability are core controls."],
    highlights_tr: [
      "Uyumluluk kalitesi, satış söylemlerinden daha önemlidir.",
      "Vatandaşlık odaklı alımlar yine de iyi yatırım olmalıdır.",
      "Değerleme ve ödeme izlenebilirliği temel kontrol noktalarıdır.",
    ],
    highlights_ru: [
      "Качество соответствия требованиям важнее маркетинговых заявлений.",
      "Сделки ради гражданства всё равно должны оставаться качественными инвестициями.",
      "Оценка и прозрачность платежей являются базовыми контрольными точками.",
    ],
    relatedLinks: [
      { to: "/listing?citizenshipEligible=true", label: "Eligible Listings" },
      { to: "/turkish-citizenship-real-estate-guide", label: "Full Citizenship Guide" },
      { to: "/title-deed-and-valuation-process-in-turkey", label: "Valuation And Tapu" },
    ],
    relatedLinks_tr: [
      { to: "/listing?citizenshipEligible=true", label: "Uygun İlanlar" },
      { to: "/turkish-citizenship-real-estate-guide", label: "Tam Vatandaşlık Rehberi" },
      { to: "/title-deed-and-valuation-process-in-turkey", label: "Değerleme ve Tapu" },
    ],
    relatedLinks_ru: [
      { to: "/listing?citizenshipEligible=true", label: "Подходящие объекты" },
      { to: "/turkish-citizenship-real-estate-guide", label: "Полный гид по гражданству" },
      { to: "/title-deed-and-valuation-process-in-turkey", label: "Оценка и тапу" },
    ],
    introParagraphs: citizenshipPack.introParagraphs,
    introParagraphs_tr: [
      "Gayrimenkul yoluyla vatandaşlık alımlarında başarı, sadece uygun bir fiyat bulmaktan değil, süreci baştan sona uyumluluk disiplinine göre yönetmekten gelir. Alıcılar genellikle ilçe kalitesi, belge düzeni ve çıkış esnekliğini birlikte değerlendirdiğinde daha sağlıklı sonuçlar alır.",
      "Türkiye'de vatandaşlık için uygun görünen iki fırsat, değerleme yapısı, ödeme izi ve yeniden satış gücü açısından çok farklı sonuçlar doğurabilir. Doğru yaklaşım, hukuki uygunluğu yatırım mantığından ayırmadan ilerlemektir.",
    ],
    introParagraphs_ru: [
      "В покупках ради гражданства успех зависит не только от подходящей цены, но и от того, насколько дисциплинированно вы ведёте процесс с точки зрения соответствия правилам. Покупатели обычно получают лучший результат, когда сравнивают качество района, документацию и будущую ликвидность вместе.",
      "Два объекта, которые на первый взгляд подходят под программу гражданства в Турции, могут сильно отличаться по логике оценки, прозрачности платежей и силе повторной продажи. Правильный подход не отделяет юридическую чистоту от инвестиционного качества.",
    ],
    sections: citizenshipPack.sections,
    sections_tr: [
      {
        heading: "Vatandaşlık Odaklı Pazarı Nasıl Değerlendirmeli",
        paragraphs: [
          "Hedefinizi sadece vatandaşlığa uygunluk olarak değil, aynı zamanda varlığın gelecekte nasıl performans göstereceği olarak tanımlayın. Bu, ilçe seçimi, mülk tipi ve bütçe bandını daha sağlıklı şekilde daraltır.",
          "Talep derinliğini yeni arz ve yeniden satış esnekliğiyle birlikte karşılaştırın. Bugün uygun olan her varlık, gelecekte likit kalacak anlamına gelmez.",
        ],
      },
      {
        heading: "Süreci Güvenli Şekilde Nasıl Yürütmeli",
        paragraphs: [
          "Hukuki inceleme, değerleme mantığı ve ödeme izi, sürecin sonunda değil daha karar aşamasında kontrol edilmelidir. Bu disiplin zayıf dosyaları erken safhada ayıklar.",
          "En sağlam sonuç genellikle belge kalitesi, yatırım mantığı ve gelecekteki çıkış imkanı aynı anda tutarlı olan varlıklarda ortaya çıkar.",
        ],
      },
    ],
    sections_ru: [
      {
        heading: "Как оценивать рынок, если покупка связана с гражданством",
        paragraphs: [
          "Определите цель не только как получение гражданства, но и как покупку актива, который должен сохранить качество в будущем. Это быстрее сузит выбор по району, типу объекта и бюджету.",
          "Сравнивайте глубину спроса с новым предложением и гибкостью выхода из инвестиции. Не каждый объект, который соответствует правилам сегодня, будет ликвидным завтра.",
        ],
      },
      {
        heading: "Как безопасно провести сделку",
        paragraphs: [
          "Юридическая проверка, логика оценки и прозрачность платежа должны контролироваться ещё до финального решения, а не в самом конце процесса. Такая дисциплина помогает рано отсеивать слабые варианты.",
          "Лучший результат обычно дают те активы, у которых документы, инвестиционная логика и будущая ликвидность совместимы одновременно.",
        ],
      },
    ],
    faqs: faq([
      ["Can any property be used for citizenship?", "No. Eligibility depends on current regulation, documentation quality, and transaction structure."],
      ["Should citizenship buyers ignore rental yield?", "No. Asset quality and compliance should be evaluated together."],
      ["What creates the highest risk?", "Weak documentation, unclear payment trails, and over-reliance on marketing promises."],
    ]),
    faqs_tr: faq([
      ["Her gayrimenkul vatandaşlık için kullanılabilir mi?", "Hayır. Uygunluk, güncel mevzuat, belge kalitesi ve işlem yapısına bağlıdır."],
      ["Vatandaşlık alıcıları kira getirisini göz ardı etmeli mi?", "Hayır. Varlık kalitesi ile uyumluluk birlikte değerlendirilmelidir."],
      ["En yüksek risk nereden doğar?", "Zayıf dokümantasyon, belirsiz ödeme izi ve pazarlama söylemlerine fazla güvenmek en büyük riski yaratır."],
    ]),
    faqs_ru: faq([
      ["Можно ли использовать для гражданства любой объект?", "Нет. Соответствие зависит от актуальных правил, качества документов и структуры сделки."],
      ["Должны ли покупатели ради гражданства игнорировать арендную доходность?", "Нет. Качество актива и соответствие правилам нужно оценивать вместе."],
      ["Что создаёт наибольший риск?", "Слабая документация, непрозрачные платежи и чрезмерная опора на маркетинговые обещания создают максимальный риск."],
    ]),
    ctaSection: cta("Surface eligible properties before legal review starts", "Filter current inventory for eligibility and compare it against city, district, and payment-plan priorities.", "Explore eligible properties", "/listing?citizenshipEligible=true", "Read the full guide", "/turkish-citizenship-real-estate-guide"),
    cta_tr: cta(
      "Hukuki inceleme başlamadan önce uygun gayrimenkulleri görün",
      "Mevcut portföyü uygunluk için filtreleyin ve şehir, ilçe ve ödeme planı önceliklerinizle birlikte karşılaştırın.",
      "Uygun gayrimenkulleri keşfet",
      "/listing?citizenshipEligible=true",
      "Tam rehberi oku",
      "/turkish-citizenship-real-estate-guide"
    ),
    cta_ru: cta(
      "Подберите подходящие объекты ещё до начала юрпроверки",
      "Отфильтруйте актуальное предложение по критериям соответствия и сравните его с приоритетами по городу, району и рассрочке.",
      "Посмотреть подходящие объекты",
      "/listing?citizenshipEligible=true",
      "Читать полный гид",
      "/turkish-citizenship-real-estate-guide"
    ),
  }),
  page({
    slug: "buy-property-in-istanbul",
    title: "Buy Property in Istanbul",
    seoTitle: "Buy Property in Istanbul | Foreign Buyer Guide",
    description: "Buy property in Istanbul with a clear guide to districts, title checks, valuation, closing costs, and smarter investment decisions.",
    breadcrumbLabel: "Buy Property in Istanbul",
    pageType: "pillar page",
    taxonomy: { contentType: "pillar page", category: "istanbul properties", subcategory: "buying process", city: "Istanbul", country: "Turkey", tags: ["buy property", "step by step"], intents: ["investment", "family-living", "legal-tax"] },
    highlights: ["Define district and budget fit before tours.", "Run valuation and title review before offers harden.", "Model closing costs from the start."],
    relatedLinks: [
      { to: "/listing?search=Istanbul", label: "Browse Istanbul inventory" },
      { to: "/closing-costs-buying-property-turkey", label: "Closing Costs" },
      { to: "/title-deed-and-valuation-process-in-turkey", label: "Title Deed Process" },
    ],
    introParagraphs: istanbulPack.introParagraphs,
    sections: [
      { heading: "Step 1: Define Market Fit", paragraphs: ["Start with objective, budget band, and district fit before you review listings.", "Separate lifestyle-led districts from yield-led districts so the shortlist stays coherent."] },
      { heading: "Step 2: Pre-Screen Listings", paragraphs: ["Use district, room mix, building age, and documentation quality to eliminate weak options early.", "Only shortlist stock that still looks attractive after taxes, fees, and maintenance are added."] },
      { heading: "Step 3: Validate Before Offer", paragraphs: ["Run title deed checks, valuation review, seller authority review, and payment-structure checks before committing to deposits.", "If the property is off-plan, review developer track record and handover protections separately from marketing material."] },
    ],
    faqs: faq([
      ["What should foreign buyers do first in Istanbul?", "Define district fit, budget range, and objective before contacting sellers."],
      ["When should valuation review happen?", "Before the transaction structure becomes rigid."],
      ["Is district selection more important than unit size?", "For many buyers, yes. District quality usually drives liquidity more than a marginal size difference."],
    ]),
    ctaSection: cta("Turn district research into a workable shortlist", "Compare ready properties, projects, citizenship options, and installment stock in Istanbul without restarting the search each time.", "See Istanbul listings", "/listing?search=Istanbul", "Explore Istanbul districts", "/best-areas-in-istanbul-for-investment"),
  }),
  page({
    slug: "turkish-citizenship-real-estate-guide",
    title: "Turkish Citizenship Real Estate Guide for Foreign Buyers",
    description: "Understand the full citizenship path through real estate, including eligibility logic, valuation checks, payment traceability, and asset selection.",
    breadcrumbLabel: "Turkish Citizenship Guide",
    pageType: "pillar page",
    taxonomy: { contentType: "pillar page", category: "turkish citizenship", country: "Turkey", tags: ["citizenship guide", "foreign buyers"], intents: ["citizenship", "investment", "legal-tax"], citizenship: true },
    highlights: ["Eligibility is a transaction-structure question, not just a price question.", "The best citizenship purchase still preserves rental and resale flexibility.", "Documentation quality determines process speed and safety."],
    relatedLinks: [
      { to: "/listing?citizenshipEligible=true", label: "Eligible Inventory" },
      { to: "/property-taxes-in-turkey", label: "Property Taxes" },
      { to: "/title-deed-and-valuation-process-in-turkey", label: "Valuation And Tapu" },
    ],
    introParagraphs: citizenshipPack.introParagraphs,
    sections: [
      { heading: "Eligibility Logic", paragraphs: ["Citizenship-led purchases need proper valuation logic, documented payment flow, and assets that fit current compliance criteria.", "The right question is not only whether a listing is eligible today, but whether the whole transaction stays clean under review."] },
      { heading: "Asset Selection", paragraphs: ["Choose liquid districts and practical unit types whenever possible so the citizenship route does not compromise future exit quality.", "Evaluate ready stock and project stock differently because timing and documentation risk are not interchangeable."] },
      { heading: "Execution Controls", paragraphs: ["Keep valuation, legal review, seller verification, and payment trail inside one controlled workflow.", "Process errors usually cost more than paying slightly more for a better-documented asset."] },
    ],
    faqs: faq([
      ["Is citizenship eligibility the same as investment quality?", "No. Eligibility is one filter. District quality and liquidity still matter."],
      ["Can buyers use off-plan projects for citizenship?", "Potentially, but only with stricter documentation and timing review."],
      ["Why is payment traceability so important?", "Because clean funds flow reduces compliance risk during review."],
    ]),
    ctaSection: cta("Start from verified eligibility, not sales scripts", "Filter current citizenship-eligible inventory and compare it with Istanbul, Antalya, and payment-plan priorities in one flow.", "Browse eligible listings", "/listing?citizenshipEligible=true", "Ask for legal-minded guidance", "/consultants"),
  }),
  page({
    slug: "property-taxes-in-turkey",
    title: "Property Taxes in Turkey: What Foreign Buyers Should Budget For",
    description: "Review the main property taxes and recurring ownership costs in Turkey so acquisition models reflect real net return and not optimistic gross assumptions.",
    breadcrumbLabel: "Property Taxes in Turkey",
    pageType: "supporting article",
    taxonomy: { contentType: "supporting article", category: "legal & tax", country: "Turkey", tags: ["taxes", "costs"], intents: ["legal-tax", "investment"] },
    highlights: ["Taxes shape real yield, not just compliance.", "Budgeting errors often come from ignoring recurring ownership drag.", "Tax review should sit beside legal and financing review."],
    relatedLinks: [
      { to: "/closing-costs-buying-property-turkey", label: "Closing Costs" },
      { to: "/turkey-property-investment", label: "Investment Framework" },
      { to: "/listing", label: "Current Listings" },
    ],
    introParagraphs: ["Property taxes in Turkey matter because they change actual holding performance, not only compliance workload.", "Foreign buyers should separate one-time acquisition costs from recurring ownership costs so the model stays clear."],
    sections: [
      { heading: "Acquisition Costs", paragraphs: ["Model the tax and fee stack before negotiation so your offer reflects full landed cost rather than asking price alone.", "If the deal is developer-led, confirm how taxes and registration costs are handled in the contract package."] },
      { heading: "Recurring Ownership Costs", paragraphs: ["Recurring taxes, dues, management, and maintenance affect net return every year.", "Run conservative scenarios instead of relying on best-case occupancy assumptions."] },
      { heading: "Why Tax Planning Changes Decisions", paragraphs: ["A tax-efficient structure still needs a liquid asset underneath it.", "Legal, tax, and resale planning should be reviewed together so the purchase remains coherent after closing."] },
    ],
    faqs: faq([
      ["Why should foreign buyers study taxes before making an offer?", "Because taxes influence real acquisition cost and long-term net return."],
      ["Are taxes relevant only for rental investors?", "No. End users also need tax clarity because ownership cost affects affordability and future exit options."],
      ["What is the most common tax-budgeting mistake?", "Treating taxes as a late-stage detail instead of part of underwriting."],
    ]),
    ctaSection: cta("Model real ownership cost before you shortlist", "If you are comparing investment listings, bring taxes, dues, and closing costs into the same decision view.", "View investment-ready stock", "/listing", "See closing costs guide", "/closing-costs-buying-property-turkey"),
  }),
  page({
    slug: "installment-property-in-turkey",
    title: "Installment Property in Turkey: How to Compare Payment Plan Projects",
    description: "Evaluate installment property opportunities in Turkey with a clearer lens on total cost, developer quality, contract structure, and market fit.",
    breadcrumbLabel: "Installment Property in Turkey",
    pageType: "pillar page",
    taxonomy: { contentType: "pillar page", category: "financing & costs", country: "Turkey", tags: ["installment", "payment plan"], intents: ["installment", "investment", "family-living"], installment: true },
    highlights: ["Payment-plan convenience should not hide total-cost inflation.", "Developer execution risk matters more in installment-led projects.", "Installment stock should still be ranked by district quality."],
    relatedLinks: [
      { to: "/listing?installmentAvailable=true", label: "Installment Listings" },
      { to: "/projects?projectType=local", label: "Local Projects" },
      { to: "/buy-property-in-istanbul", label: "Buying Process Guide" },
    ],
    introParagraphs: ["Installment property in Turkey can help buyers stage capital deployment, but the correct comparison is total economic cost, not only monthly convenience.", "Payment-plan projects deserve a stricter review of developer quality, delivery discipline, and contract protections."],
    sections: [
      { heading: "Total Cost Review", paragraphs: ["Compare final price, payment schedule, handover timing, and fit-out assumptions before deciding a plan is cheaper.", "Installment structures can improve cashflow flexibility while still producing a weaker final acquisition if pricing discipline is missing."] },
      { heading: "Developer And Contract Review", paragraphs: ["Short payment plans do not remove project execution risk.", "Review delivery track record, contract milestones, and delay clauses carefully."] },
      { heading: "Exit And Rental Fit", paragraphs: ["The end asset still needs tenant demand and resale liquidity.", "Installment flexibility is not a substitute for district quality."] },
    ],
    faqs: faq([
      ["Are installment projects always better for foreign buyers?", "No. They can improve cashflow timing, but the comparison must include total cost and delivery risk."],
      ["What should buyers check first in an installment project?", "Developer quality, contract structure, and final effective price."],
      ["Should buyers compare installment stock with ready properties?", "Yes, but only after adjusting for timing, income delay, and total acquisition cost."],
    ]),
    ctaSection: cta("Compare installment stock against ready inventory", "Review payment-plan listings and standard listings side by side before you decide flexibility outweighs execution risk.", "Explore installment listings", "/listing?installmentAvailable=true", "See projects", "/projects?projectType=local"),
  }),
  page({
    slug: "istanbul-asian-side-vs-european-side",
    title: "Istanbul Asian Side vs European Side for Property Investment",
    description: "Compare Istanbul’s Asian and European sides through liquidity, tenant demand, pricing discipline, and long-term exit quality rather than simple location bias.",
    breadcrumbLabel: "Asian Side vs European Side",
    pageType: "district page",
    taxonomy: { contentType: "district page", category: "istanbul properties", city: "Istanbul", country: "Turkey", tags: ["asian side", "european side"], intents: ["investment", "rental-income", "family-living"] },
    highlights: ["Both sides can work, but not for the same buyer profile.", "Tenant depth and pricing discipline matter more than side-based branding.", "Compare submarkets, not stereotypes."],
    relatedLinks: [
      { to: "/best-areas-in-istanbul-for-investment", label: "Best Istanbul Areas" },
      { to: "/listing?search=Istanbul", label: "Istanbul Listings" },
      { to: "/buy-property-in-istanbul", label: "Buying Guide" },
    ],
    introParagraphs: ["The Asian side versus European side debate becomes useful only when it moves from branding to actual tenant demand, commute logic, stock quality, and resale behavior.", "A strong comparison should ask which submarkets fit your budget and exit horizon instead of treating each side as one uniform market."],
    sections: [
      { heading: "Demand Profile Differences", paragraphs: ["Some districts lean more toward professional rental demand, others toward family occupancy or mixed end-user depth.", "The stronger side depends on who you expect to rent, buy, or live in the asset later."] },
      { heading: "Pricing And Supply", paragraphs: ["Side-based narratives often hide district-level oversupply and micro-market differences.", "Compare new supply pipeline, transport anchors, and practical livability before relying on macro labels."] },
      { heading: "How Investors Should Decide", paragraphs: ["Use a shortlist of districts from both sides and test them using the same model: rentability, costs, liquidity, and resilience.", "That removes emotional bias and exposes where pricing is genuinely justified."] },
    ],
    faqs: faq([
      ["Is the European side always better for investors?", "No. District-level comparison matters more than side-level assumptions."],
      ["What should buyers compare first between the two sides?", "Tenant profile, commute logic, transport access, supply pipeline, and exit demand."],
      ["Can side-based branding cause overpayment?", "Yes. Buyers often pay for a narrative when they should be underwriting a district."],
    ]),
    ctaSection: cta("Compare Istanbul districts instead of buying the label", "Move from side-level assumptions to district-level inventory and shortlist quality.", "See Istanbul stock", "/listing?search=Istanbul", "Review best areas", "/best-areas-in-istanbul-for-investment"),
  }),
  page({
    slug: "property-investment-in-antalya",
    title: "Antalya Property Investment Guide for Foreign Buyers",
    description: "Evaluate Antalya property investment opportunities with clearer filters for demand quality, coastal pricing, rental use cases, and long-term exit planning.",
    breadcrumbLabel: "Antalya Property Investment",
    pageType: "city page",
    taxonomy: { contentType: "city page", category: "regional market guides", city: "Antalya", country: "Turkey", tags: ["antalya", "investment guide"], intents: ["investment", "rental-income", "family-living"] },
    highlights: ["Antalya is not one market.", "Coastal premium must be justified by real demand.", "Net income assumptions should include seasonality and operating drag."],
    relatedLinks: [
      { to: "/listing?search=Antalya", label: "Antalya Listings" },
      { to: "/turkey-property-investment", label: "Turkey Investment Framework" },
      { to: "/installment-property-in-turkey", label: "Installment Projects" },
    ],
    introParagraphs: marketPack("Property investment in Antalya works best when district selection and operating cost discipline stay ahead of lifestyle narratives.", "Antalya").introParagraphs,
    sections: marketPack("Property investment in Antalya works best when district selection and operating cost discipline stay ahead of lifestyle narratives.", "Antalya").sections,
    faqs: faq([
      ["Is Antalya mainly a lifestyle market or an investment market?", "It can serve both, but the answer depends on district, property type, and realistic occupancy assumptions."],
      ["What creates the biggest pricing error in Antalya?", "Overpaying for coastal narrative without testing net income, liquidity, and maintenance drag."],
      ["How should Antalya be compared to Istanbul?", "Use the same framework: demand depth, supply pipeline, ownership cost, and exit liquidity."],
    ]),
    ctaSection: cta("Compare Antalya with Istanbul and installment stock", "Review regional options in one flow instead of treating Antalya as a stand-alone story.", "See Antalya listings", "/listing?search=Antalya", "Compare with Istanbul", "/best-areas-in-istanbul-for-investment"),
  }),
  page({
    slug: "cyprus-property-guide",
    title: "Cyprus Property Guide: How to Compare Listings and Projects",
    description: "Use a cleaner framework for comparing Cyprus property opportunities across lifestyle demand, project quality, rental logic, and long-term liquidity.",
    breadcrumbLabel: "Cyprus Property Guide",
    pageType: "pillar page",
    taxonomy: { contentType: "pillar page", category: "international markets", country: "Cyprus", tags: ["cyprus", "international"], intents: ["investment", "rental-income", "lifestyle"] },
    highlights: ["Country-level decisions still need city and district underwriting.", "Project quality should be ranked before amenities.", "Compare Cyprus against Turkey and nearby markets with the same framework."],
    relatedLinks: [
      { to: "/listing?search=Cyprus", label: "Cyprus Listings" },
      { to: "/projects?projectType=international", label: "International Projects" },
      { to: "/kyrenia-apartments", label: "Kyrenia Guide" },
    ],
    introParagraphs: ["A useful Cyprus property guide should do more than present locations attractively. Buyers need a way to compare inventory, project quality, legal clarity, and probable user demand.", "The strongest comparisons happen when Cyprus is evaluated with the same underwriting logic applied to Turkey or other regional options."],
    sections: [
      { heading: "Market Fit", paragraphs: ["Start with use case: end use, long-stay rental, short-stay strategy, or capital preservation.", "Country-level interest should be narrowed into city-level and district-level filters before any property is shortlisted."] },
      { heading: "Project Review", paragraphs: ["Compare delivery quality, operating cost intensity, management quality, and practical livability rather than amenity density alone.", "Projects with strong maintenance planning usually retain better net performance over time."] },
      { heading: "Cross-Market Comparison", paragraphs: ["Cyprus stock should be compared against nearby alternatives using identical criteria so marketing narratives do not distort capital allocation.", "That is especially important for foreign buyers choosing between lifestyle and investment outcomes."] },
    ],
    faqs: faq([
      ["Should buyers compare Cyprus projects with Turkey projects directly?", "Yes, if the same underwriting model is used."],
      ["What is the first screen for Cyprus property?", "Use case, location fit, documentation quality, and operating cost assumptions."],
      ["Should buyers focus only on coastal stock?", "No. Coastal appeal can be valuable, but it should not override pricing discipline and liquidity analysis."],
    ]),
    ctaSection: cta("Compare Cyprus inventory against regional alternatives", "Use the same filters across Cyprus, Turkey, and nearby project markets before you commit to one geography.", "Browse Cyprus listings", "/listing?search=Cyprus", "See international projects", "/projects?projectType=international"),
  }),
  page({
    slug: "best-areas-in-istanbul-for-investment",
    title: "Best Areas in Istanbul for Investment: How to Rank Districts Properly",
    description: "Review Istanbul districts using transport, demand, supply pressure, price discipline, and liquidity instead of popularity-driven shortlists.",
    breadcrumbLabel: "Best Areas in Istanbul",
    pageType: "district page",
    taxonomy: { contentType: "district page", category: "istanbul properties", city: "Istanbul", country: "Turkey", tags: ["istanbul districts", "investment areas"], intents: ["investment", "rental-income", "family-living"] },
    highlights: ["No single district is best for every buyer.", "Transport and tenant depth often matter more than prestige.", "District ranking changes with budget band and exit horizon."],
    relatedLinks: [
      { to: "/buy-property-in-istanbul", label: "Buying Process" },
      { to: "/istanbul-asian-side-vs-european-side", label: "Asian vs European Side" },
      { to: "/listing?search=Istanbul", label: "Istanbul Listings" },
    ],
    introParagraphs: ["The best areas in Istanbul for investment depend on who the future buyer or tenant is, what budget band you are operating in, and how much execution risk you will accept.", "District selection works best when it is tied to demand, supply, liquidity, and cost structure rather than reputation alone."],
    sections: [
      { heading: "How To Rank Districts", paragraphs: ["Score districts on transport, convenience, tenant profile depth, and new-supply pressure.", "Then compare price quality inside the district instead of assuming every property there deserves a premium."] },
      { heading: "Budget Band Effects", paragraphs: ["The right district for entry capital is not always the right district for upper-tier capital.", "District quality must be matched to the segment you can buy competitively within."] },
      { heading: "Exit And Liquidity", paragraphs: ["The best districts usually remain easier to sell across different market phases because they appeal to multiple buyer types.", "That is why liquidity should be treated as part of investment return, not a separate topic."] },
    ],
    faqs: faq([
      ["What makes one Istanbul district stronger than another?", "Usually a better mix of access, livability, demand depth, and supply discipline."],
      ["Should investors focus only on central districts?", "No. Some peripheral or emerging districts can offer stronger value if demand and transport logic are clear."],
      ["Does the best district change by budget?", "Yes. Budget band affects where you can buy quality stock without paying narrative premiums."],
    ]),
    ctaSection: cta("Turn district research into live listing comparisons", "Move from area research to active inventory without losing your district-level filters.", "Explore Istanbul inventory", "/listing?search=Istanbul", "Read the buying guide", "/buy-property-in-istanbul"),
  }),
  page({
    slug: "title-deed-and-valuation-process-in-turkey",
    title: "Title Deed and Valuation Process in Turkey: What Buyers Should Verify",
    description: "Understand how title deed review and valuation work in Turkey so foreign buyers can reduce legal risk and negotiate with cleaner information.",
    breadcrumbLabel: "Title Deed And Valuation",
    pageType: "supporting article",
    taxonomy: { contentType: "supporting article", category: "legal & tax", country: "Turkey", tags: ["title deed", "valuation", "tapu"], intents: ["legal-tax", "investment", "citizenship"], citizenship: true },
    highlights: ["Tapu review is a risk filter, not an afterthought.", "Valuation is most useful while it still affects buy-or-walk decisions.", "Documentation quality affects speed, compliance, and resale."],
    relatedLinks: [
      { to: "/property-taxes-in-turkey", label: "Property Taxes" },
      { to: "/turkish-citizenship-real-estate-guide", label: "Citizenship Guide" },
      { to: "/buy-property-in-istanbul", label: "Buying Process" },
    ],
    introParagraphs: ["The title deed and valuation process in Turkey should be treated as a decision layer, not only a transaction formality.", "This is especially important for foreign buyers and citizenship-led transactions where documentation quality directly affects execution certainty."],
    sections: [
      { heading: "What Title Review Should Confirm", paragraphs: ["Title integrity, seller authority, restrictions, liens, and transfer readiness should all be reviewed before funds flow becomes irreversible.", "If the legal package is unclear, discount alone is rarely a good reason to proceed."] },
      { heading: "What Valuation Should Do", paragraphs: ["Valuation should test whether the pricing logic is defensible relative to district, unit type, and market conditions.", "It is most valuable before you commit, not after you have already justified the deal emotionally."] },
      { heading: "Why It Matters For Future Liquidity", paragraphs: ["Clean title and rational valuation improve future refinancing, resale, and compliance flexibility.", "Process quality protects long-term asset performance."] },
    ],
    faqs: faq([
      ["Why should title deed review happen early?", "Because it can eliminate weak deals before time and capital are wasted."],
      ["Does valuation only matter for citizenship cases?", "No. It matters for any buyer who wants pricing discipline and future exit clarity."],
      ["Can a strong district compensate for weak title review?", "No. Location strength does not fix documentation risk."],
    ]),
    ctaSection: cta("Filter inventory with legal and valuation discipline", "Shortlist live properties, then rank them by district fit and due-diligence readiness instead of brochure appeal.", "Browse listings", "/listing", "See citizenship guide", "/turkish-citizenship-real-estate-guide"),
  }),
  page({
    slug: "closing-costs-buying-property-turkey",
    title: "Closing Costs When Buying Property in Turkey",
    description: "Map the closing cost layer clearly before purchase so offers, financing decisions, and target returns reflect full acquisition cost.",
    breadcrumbLabel: "Closing Costs In Turkey",
    pageType: "supporting article",
    taxonomy: { contentType: "supporting article", category: "financing & costs", country: "Turkey", tags: ["closing costs", "buying costs"], intents: ["legal-tax", "investment", "family-living"] },
    highlights: ["Headline price is not the same as acquisition cost.", "Closing-cost clarity improves offer discipline.", "Cost transparency should be part of every shortlist."],
    relatedLinks: [
      { to: "/property-taxes-in-turkey", label: "Property Taxes" },
      { to: "/buy-property-in-istanbul", label: "Buying Process" },
      { to: "/listing", label: "Listings" },
    ],
    introParagraphs: ["Closing costs in Turkey should be included in the underwriting model before buyers treat a property as affordable.", "A clean buying process separates listing price, one-time closing cost, and recurring ownership cost so capital planning remains realistic."],
    sections: [
      { heading: "What Closing Costs Change", paragraphs: ["They change effective entry price and therefore affect both leverage planning and yield expectations.", "For foreign buyers, these costs also influence currency planning and available liquidity after closing."] },
      { heading: "How Buyers Should Use Cost Clarity", paragraphs: ["Use full-cost visibility to set a real offer ceiling before negotiations start.", "That protects you from agreeing to a price that only worked on a partial budget view."] },
      { heading: "Why This Matters For Portfolio Decisions", paragraphs: ["Once closing costs are modeled correctly, some districts and property types become more attractive while others lose appeal.", "Cost discipline is a strategic filter, not a late-stage admin task."] },
    ],
    faqs: faq([
      ["Why should closing costs be modeled before negotiations?", "Because they change your true maximum offer."],
      ["Are closing costs relevant for end users as well as investors?", "Yes. They affect affordability, cash reserve planning, and future liquidity."],
      ["Should buyers compare full cost across cities too?", "Yes. Full-cost comparison helps avoid city and district decisions based on superficial price gaps."],
    ]),
    ctaSection: cta("Compare full entry cost before you commit", "Review listings with taxes, fees, and ownership drag in mind so the shortlist stays financially coherent.", "Explore listings", "/listing", "See tax guide", "/property-taxes-in-turkey"),
  }),
];

export const contentHubPagesBySlug = contentHubPages.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const resolveLocalizedGuidePage = (page, language = "en") => {
  if (!page) return null;

  const normalizedLanguage = String(language || "en").trim().toLowerCase();
  const suffix =
    normalizedLanguage.startsWith("tr")
      ? "tr"
      : normalizedLanguage.startsWith("ru")
      ? "ru"
      : "en";

  const pickLocalizedValue = (field) => page?.[`${field}_${suffix}`] ?? page?.[field];
  const localizedTitle = pickLocalizedValue("title");

  return {
    ...page,
    title: localizedTitle,
    seoTitle: page?.[`seoTitle_${suffix}`] ?? localizedTitle,
    description: pickLocalizedValue("description"),
    breadcrumbLabel: pickLocalizedValue("breadcrumbLabel"),
    highlights: pickLocalizedValue("highlights"),
    relatedLinks: pickLocalizedValue("relatedLinks"),
    introParagraphs: pickLocalizedValue("introParagraphs"),
    sections: pickLocalizedValue("sections"),
    faqs: pickLocalizedValue("faqs"),
    cta: pickLocalizedValue("cta"),
  };
};

export const getGuidePageBySlug = (slug = "", language = "en") =>
  resolveLocalizedGuidePage(contentHubPagesBySlug[String(slug || "").trim()] || null, language);
