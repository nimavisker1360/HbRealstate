const expandFlatMap = (flatMap) =>
  Object.entries(flatMap).reduce((acc, [key, value]) => {
    const parts = key.split(".");
    let node = acc;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        node[part] = value;
        return;
      }

      node[part] ||= {};
      node = node[part];
    });

    return acc;
  }, {});

const enFlatMap = {
  "services.common.propertyTypes.apartment": "Apartment",
  "services.common.propertyTypes.villa": "Villa",
  "services.common.propertyTypes.office": "Office",
  "services.common.propertyTypes.commercial": "Commercial",
  "services.common.propertyTypes.land": "Land",
  "services.common.propertyTypes.building": "Building",
  "services.inspection.form.keepChatOpen": "Need to add anything else?",
  "services.inspection.landing.previewMetricStructure": "Structure",
  "services.inspection.landing.previewMetricUtilities": "Utilities",
  "services.inspection.landing.previewMetricRisk": "Risk",
  "services.staging.landing.packageCategories.visual-refresh.label": "Visual refresh",
  "services.staging.landing.packageCategories.visual-refresh.summary":
    "A lighter scope focused on presentation quality, cleaner visuals, and faster listing readiness.",
  "services.staging.landing.packageCategories.sale-ready.label": "Sale ready",
  "services.staging.landing.packageCategories.sale-ready.summary":
    "A broader package that blends selective renovation, staging, and media for stronger pricing power.",
  "services.staging.landing.packageCategories.premium-boost.label": "Premium boost",
  "services.staging.landing.packageCategories.premium-boost.summary":
    "A premium launch scope for assets where finish, content, and visibility need to move together.",
  "services.staging.landing.packageCategories.custom.label": "Custom scope",
  "services.staging.landing.packageCategories.custom.summary":
    "A tailored scope built around the asset, timeline, and commercial objective.",
  "services.staging.landing.packageCategories.default.summary":
    "Scope is adapted to the asset, visibility target, and delivery timeline.",
  "services.staging.landing.packageOrderLabel": "Package",
  "services.staging.landing.packageDaysSuffix": "days",
  "services.staging.landing.packageMetaBudget": "Indicative budget",
  "services.staging.landing.packageMetaCustom": "Custom",
  "services.staging.landing.packageMetaTimeline": "Estimated timeline",
  "services.staging.landing.packageMetaFlexible": "Depends on scope",
  "services.staging.landing.packageMetaIncluded": "Included services",
  "services.staging.landing.packageServicesSuffix": "items",
  "services.staging.landing.packageFitTitle": "Where this package fits",
  "services.staging.projectDetail.beforeAlt": "{{title}} before",
  "services.staging.projectDetail.afterAlt": "{{title}} after",
  "services.staging.projectsPage.eyebrow": "Published transformations",
  "services.staging.projectsPage.countLabel": "Published case studies",
  "services.staging.projectsPage.ctaRequest": "Request consultation",
  "services.staging.projectsPage.emptyTitle":
    "Published staging projects will appear here as soon as they go live",
  "services.staging.projectsPage.emptyBody":
    "This showcase only uses published projects from the admin system. If none are live yet, request a consultation and we can still propose the right scope.",
  "services.staging.projectsPage.previewLabel": "Published project",
  "services.staging.projectsPage.metaFallback": "Shared on request",
  "services.staging.projectsPage.timelineFallback": "Depends on scope",
  "services.staging.projectsPage.budgetFallback": "Tailored to the project",
  "services.staging.projectsPage.beforeAfterReady": "Before / after media published",
  "services.staging.projectDetail.notFoundBody":
    "This project may have been unpublished, renamed, or is not available for public viewing.",
  "services.staging.projectDetail.ctaConsultation": "Request consultation",
  "services.staging.projectDetail.beforeAfterEyebrow": "Before / after comparison",
  "services.staging.projectDetail.beforeAfterTitle": "Primary transformation view",
  "services.staging.projectDetail.mediaPendingTitle": "Before / after media will appear here",
  "services.staging.projectDetail.mediaPendingBody":
    "This project is published, but the public comparison media has not been attached yet.",
  "services.staging.projectDetail.galleryTitle": "Additional before / after views",
  "services.staging.projectDetail.galleryBody":
    "Extra views help show how the scope carried across multiple spaces inside the property.",
  "services.staging.projectDetail.testimonialEyebrow": "Client perspective",
  "services.staging.projectDetail.testimonialTitle": "Testimonial",
  "services.staging.projectDetail.mediaLinksTitle": "Published media links",
  "services.staging.projectDetail.mediaLink.virtualTour": "Virtual tour",
  "services.staging.projectDetail.mediaLink.droneFootage": "Drone footage",
  "services.staging.projectDetail.mediaLink.floorPlan": "Floor plan",
  "services.staging.projectDetail.openLink": "Open media",
  "services.staging.projectDetail.packageEyebrow": "Package context",
  "services.staging.projectDetail.packageTitle": "Selected package",
  "services.staging.projectDetail.metricsTitle": "Published outcome signals",
  "services.staging.projectDetail.consultationEyebrow": "Discuss a similar scope",
  "services.staging.projectDetail.consultationTitle":
    "Brief your property and we can propose the right staging or renovation level.",
  "services.staging.projectDetail.consultationBody":
    "Share the asset, timeline, and target outcome. The public showcase is real, but every scope is still matched to the property.",
  "services.staging.projectDetail.minimalState":
    "This published project currently includes limited public fields. As more media and narrative are added in admin, this page will enrich automatically.",
  "services.enums.staging.service.decluttering": "Decluttering",
  "services.enums.staging.service.deep_cleaning": "Deep cleaning",
  "services.enums.staging.service.minor_repairs": "Minor repairs",
  "services.enums.staging.service.painting": "Painting",
  "services.enums.staging.service.furniture_rental": "Furniture rental",
  "services.enums.staging.service.accessory_styling": "Accessory styling",
  "services.enums.staging.service.professional_photography": "Professional photography",
  "services.enums.staging.service.videography": "Videography",
  "services.enums.staging.service.drone_footage": "Drone footage",
  "services.enums.staging.service.virtual_tour_360": "360 virtual tour",
  "services.enums.staging.service.floor_plan_2d": "2D floor plan",
  "services.enums.staging.service.floor_plan_3d": "3D floor plan",
  "services.enums.staging.service.social_media_content": "Social media content",
  "services.enums.staging.service.listing_copywriting": "Listing copywriting",
  "services.enums.staging.service.home_staging_full": "Full home staging",
  "services.enums.staging.service.renovation_light": "Light renovation",
  "services.enums.staging.service.renovation_full": "Full renovation",
  "services.privatePanel.eyebrow": "Private request panel",
  "services.privatePanel.title": "My Service Requests",
  "services.privatePanel.subtitle":
    "See your staging, renovation, and inspection requests in one place.",
  "services.privatePanel.refresh": "Refresh",
  "services.privatePanel.loadError": "Unable to load your requests.",
  "services.privatePanel.emptyTitle": "No requests yet",
  "services.privatePanel.emptyBody":
    "Your staging, renovation, and inspection requests will appear here after submission.",
  "services.privatePanel.ctaStaging": "Submit staging request",
  "services.privatePanel.ctaInspection": "Submit inspection request",
  "services.privatePanel.stagingSectionTitle": "Staging & Renovation",
  "services.privatePanel.stagingSectionBody":
    "Presentation, renovation, and project updates from the company.",
  "services.privatePanel.inspectionSectionTitle": "Inspection Requests",
  "services.privatePanel.inspectionSectionBody":
    "Inspection request status, score, and report updates.",
  "services.privatePanel.stagingLabel": "Staging / Renovation",
  "services.privatePanel.stagingFallbackTitle": "Staging / renovation request",
  "services.privatePanel.inspectionLabel": "Inspection",
  "services.privatePanel.inspectionFallbackTitle": "Property inspection request",
  "services.privatePanel.submittedOn": "Submitted",
  "services.privatePanel.projectLabel": "Project",
  "services.privatePanel.reportLabel": "Report",
  "services.privatePanel.requestSummary": "Your request",
  "services.privatePanel.goal": "Goal",
  "services.privatePanel.requestBudget": "Budget",
  "services.privatePanel.requestTimeline": "Timeline",
  "services.privatePanel.property": "Property",
  "services.privatePanel.requestedServices": "Requested services",
  "services.privatePanel.yourNotes": "Your notes",
  "services.privatePanel.companyUpdate": "Company update",
  "services.privatePanel.visitChecklist": "Visit checklist",
  "services.privatePanel.visitScheduled": "Property visit booked",
  "services.privatePanel.visitScheduledBody":
    "The company has shared your property visit time. Review the schedule and note below.",
  "services.privatePanel.visitDateTime": "Visit time",
  "services.privatePanel.visitLocation": "Location",
  "services.privatePanel.visitNote": "Checklist note",
  "services.privatePanel.companyBudget": "Company estimate",
  "services.privatePanel.companyTimeline": "Working timeline",
  "services.privatePanel.scope": "Current scope",
  "services.privatePanel.metricValueUplift": "Value uplift",
  "services.privatePanel.metricRentalUplift": "Rental uplift",
  "services.privatePanel.metricSaleSpeed": "Sale speed",
  "services.privatePanel.metricSaleSpeedValue": "{{days}} days faster",
  "services.privatePanel.viewPublicShowcase": "View public showcase",
  "services.privatePanel.privateOnly": "Visible only in your private account until published.",
  "services.privatePanel.pendingCompanyUpdate":
    "The company has not added a formal project update yet.",
  "services.privatePanel.requestType": "Request type",
  "services.privatePanel.urgency": "Urgency",
  "services.privatePanel.requester": "Requester",
  "services.privatePanel.referenceCode": "Reference",
  "services.privatePanel.scheduleLabel": "Schedule",
  "services.privatePanel.inspectionScore": "Inspection score",
  "services.privatePanel.riskLabel": "Risk label",
  "services.privatePanel.reportStatus": "Report status",
  "services.privatePanel.updatedLabel": "Last update",
  "services.privatePanel.sectionScores": "Section scores",
  "services.privatePanel.propertyOutcome": "What will happen to your property",
  "services.privatePanel.recommendation": "Recommendation",
  "services.privatePanel.beforePhotos": "Before",
  "services.privatePanel.afterPhotos": "After",
  "services.privatePanel.beforePhotoAlt": "Before property preview {{index}}",
  "services.privatePanel.afterPhotoAlt": "After property preview {{index}}",
  "services.privatePanel.noBeforePreview": "No before preview uploaded",
  "services.privatePanel.noAfterPreview": "No after preview uploaded",
  "services.privatePanel.keyFindings": "Key findings",
  "services.privatePanel.repairEstimates": "Repair estimates",
  "services.privatePanel.openReportFile": "Open report file",
  "services.privatePanel.pendingInspectionUpdate":
    "The company has not added a checklist or report update yet.",
  "services.privatePanel.inspectionSections.structuralSafety": "Structural safety",
  "services.privatePanel.inspectionSections.legalCompliance": "Legal compliance",
  "services.privatePanel.inspectionSections.utilitiesPlumbing": "Utilities and plumbing",
  "services.privatePanel.inspectionSections.electricalSafety": "Electrical safety",
  "services.privatePanel.inspectionSections.comfortInsulation": "Comfort and insulation",
  "services.privatePanel.scoreTone.strong": "Excellent condition",
  "services.privatePanel.scoreTone.good": "Good condition",
  "services.privatePanel.scoreTone.needs_attention": "Needs attention",
  "services.privatePanel.scoreTone.high_risk": "High risk",
  "services.privatePanel.scoreTone.pending": "Pending",
  "services.privatePanel.riskValue.strong": "Low risk",
  "services.privatePanel.riskValue.good": "Moderate risk",
  "services.privatePanel.riskValue.needs_attention": "Needs attention",
  "services.privatePanel.riskValue.high_risk": "High risk",
  "services.privatePanel.riskValue.medium_risk": "Medium risk",
  "services.privatePanel.riskValue.low_risk": "Low risk",
  "services.privatePanel.riskValue.pending": "Pending",
  "services.privatePanel.reportStatusValue.draft": "Draft",
  "services.privatePanel.reportStatusValue.review": "In review",
  "services.privatePanel.reportStatusValue.final": "Final",
  "services.privatePanel.reportStatusValue.delivered": "Delivered",
  "services.privatePanel.findingSeverity.low": "Low",
  "services.privatePanel.findingSeverity.medium": "Medium",
  "services.privatePanel.findingSeverity.high": "High",
  "services.privatePanel.findingSeverity.critical": "Critical",
  "services.privatePanel.findingSeverity.none": "None",
  "services.privatePanel.findingStatus.good": "Good",
  "services.privatePanel.findingStatus.acceptable": "Acceptable",
  "services.privatePanel.findingStatus.risky": "Risky",
  "services.privatePanel.findingStatus.critical": "Critical",
  "services.privatePanel.findingStatus.not_checked": "Not checked",
  "services.privatePanel.status.new": "New",
  "services.privatePanel.status.qualified": "Qualified",
  "services.privatePanel.status.proposal_sent": "Proposal sent",
  "services.privatePanel.status.approved": "Approved",
  "services.privatePanel.status.planning": "Planning",
  "services.privatePanel.status.in_progress": "In progress",
  "services.privatePanel.status.content_pending": "Content pending",
  "services.privatePanel.status.completed": "Completed",
  "services.privatePanel.status.published": "Published",
  "services.privatePanel.status.closed": "Closed",
  "services.privatePanel.status.cancelled": "Cancelled",
  "services.privatePanel.status.contacted": "Contacted",
  "services.privatePanel.status.scheduled": "Scheduled",
  "services.privatePanel.status.in_review": "In review",
  "services.privatePanel.status.inspection_completed": "Inspection completed",
  "services.privatePanel.status.report_drafting": "Report drafting",
  "services.privatePanel.status.report_ready": "Report ready",
  "services.privatePanel.status.delivered": "Delivered",
  "services.privatePanel.status.on_hold": "On hold",
};

const trFlatMap = {
  // common
  "services.common.back": "Geri",
  "services.common.backToStepOne": "1. adıma dön",
  "services.common.continue": "Devam et",
  "services.common.file": "Dosya",
  "services.common.finalChecks": "Son kontroller",
  "services.common.fixHighlightedFields": "Lütfen işaretlenen alanları kontrol edin.",
  "services.common.invalidNonNegativeNumber": "Lütfen sıfır veya pozitif bir sayı girin.",
  "services.common.invalidPositiveNumber": "Lütfen geçerli bir pozitif sayı girin.",
  "services.common.invalidUrl": "Lütfen geçerli bir URL girin.",
  "services.common.nextStepTitle": "Sonra ne olur",
  "services.common.propertyTypes.apartment": "Daire",
  "services.common.propertyTypes.villa": "Villa",
  "services.common.propertyTypes.office": "Ofis",
  "services.common.propertyTypes.commercial": "Ticari",
  "services.common.propertyTypes.land": "Arsa",
  "services.common.propertyTypes.building": "Bina",
  "services.common.remove": "Kaldır",
  "services.common.stepOne": "Adım 1",
  "services.common.stepTwo": "Adım 2",
  "services.common.waitForUpload": "Önce fotoğraf yüklemesinin bitmesini bekleyin",

  // hub
  "services.hub.heroEyebrow": "Daha iyi gayrimenkul kararları için ticari destek",
  "services.hub.heroTitle": "Gerçek işlemler etrafında kurgulanan denetim ve sunum hizmetleri",
  "services.hub.heroSubtitle":
    "HB Gayrimenkul Hizmetleri, alıcıların gizli riski azaltmasına ve mal sahiplerinin mülkü daha ikna edici sunmasına yardımcı olur; denetim ve staging için net hizmet yolları sunar.",
  "services.hub.heroChip1": "Bağımsız denetim akışı",
  "services.hub.heroChip2": "Sunum odaklı satış desteği",
  "services.hub.heroChip3": "Çok dilli koordinasyon",
  "services.hub.heroPrimaryCta": "Denetim talep et",
  "services.hub.heroSecondaryCta": "Staging projesini planla",
  "services.hub.comparisonEyebrow": "Doğru yolu seçin",
  "services.hub.comparisonTitle": "İki hizmet, iki farklı ticari hedef",
  "services.hub.comparisonSubtitle":
    "Durum ve risk netliği gerektiğinde denetimi seçin. Daha güçlü ilk izlenim ve daha keskin ilan hikâyesi gerektiğinde staging’i seçin.",
  "services.hub.comparisonLink": "Mülkünüzü konuşalım",
  "services.hub.benefit1Title": "Harcamadan veya ilana çıkmadan önce belirsizliği azaltın",
  "services.hub.benefit1Body":
    "Daha net fiyatlama, onarım ve zamanlama kararları için denetim ve sunum çalışmalarını kullanın.",
  "services.hub.benefit2Title": "Alıcı güvenini ve ilan performansını artırın",
  "services.hub.benefit2Body":
    "Net durum raporlaması ve daha güçlü sunum, ciddi alıcıların daha az tereddütle ilerlemesine yardımcı olur.",
  "services.hub.benefit3Title": "Doğru sonraki adımı daha hızlı koordine edin",
  "services.hub.benefit3Body":
    "İster due diligence ister satışa hazır sunum ihtiyacınız olsun, hizmet yolu ilk görüşmeden itibaren nettir.",
  "services.hub.cardInspectionLong":
    "Alıcılar, mal sahipleri ve yatırımcılar için yapılandırılmış notlar, ağırlıklı puanlama ve karar odaklı raporlama içeren bağımsız saha incelemesi.",
  "services.hub.cardInspectionCta": "Denetimi inceleyin",
  "services.hub.cardInspectionPoint1": "Satın alma öncesi ve risk kontrolleri için ideal",
  "services.hub.cardInspectionPoint2": "Durumu, öncelikleri ve olası capex etkisini netleştirir",
  "services.hub.cardInspectionPoint3": "Skor mantığı ve rapor yapısını içerir",
  "services.hub.cardStagingLong":
    "İlk izlenimi güçlendirmek ve ilanların daha hızlı dönüşmesini sağlamak için tasarlanan staging, hafif yenileme ve premium pazarlama içeriği.",
  "services.hub.cardStagingCta": "Staging’i inceleyin",
  "services.hub.cardStagingPoint1": "Satışa veya kiralamaya hazırlanan mal sahipleri için ideal",
  "services.hub.cardStagingPoint2": "Sunum, medya ve pratik iyileştirmeleri birleştirir",
  "services.hub.cardStagingPoint3": "Görsel yenilemeden premium vitrine kadar ölçeklenebilir",
  "services.hub.processEyebrow": "Nasıl işler",
  "services.hub.processTitle": "Basit alım süreci, pratik sonuç",
  "services.hub.step1Title": "Doğru hizmeti seçin",
  "services.hub.step1Body":
    "Denetim, durum ve riski anlamanıza yardımcı olur. Staging ise sunumu ve piyasa tepkisini iyileştirir.",
  "services.hub.step2Title": "Mülkün temel bilgilerini paylaşın",
  "services.hub.step2Body":
    "Önce temel bilgileri gönderin. Fazladan fotoğraf, URL ve zamanlama detayları kapsamı gözden geçirdikten sonra gelebilir.",
  "services.hub.step3Title": "Pratik bir sonraki adımı alın",
  "services.hub.step3Body":
    "Sizi bir rapora, bir sunum planına veya net kapsamlı bir hizmet önerisine yönlendiririz.",
  "services.hub.trustEyebrow": "Müşteriler neden buradan başlıyor",
  "services.hub.trustTitle": "Belirsizlikten aksiyona daha net bir yol",
  "services.hub.trustBody":
    "Bu hizmetler şu ticari sorulara yanıt vermek için tasarlandı: Gerçekte neyin içine giriyorum, ilana çıkmadan önce neyi düzeltmeliyim ve kapsamı boşa büyütmeden mülkü nasıl daha iyi sunabilirim?",
  "services.hub.trustPoint1": "Alıcılar ve yatırımcılar için bağımsız durum incelemesi",
  "services.hub.trustPoint2": "Mal sahipleri ve geliştiriciler için sunum odaklı iyileştirmeler",
  "services.hub.trustPoint3": "Muğlak danışmanlık yerine net sonraki adımlar",

  // inspection-form
  "services.inspection.form.eyebrow": "Temel bilgilerle başlayın",
  "services.inspection.form.introTitle": "Kim olduğunuzu ve nasıl bir denetim istediğinizi bize anlatın.",
  "services.inspection.form.introBody":
    "İlk adım, temel iletişim ve talep detaylarını toplar. Mülk bilgilerini isterseniz bir sonraki adımda ekleyebilirsiniz.",
  "services.inspection.form.stepOneTitle": "İletişim ve talep özeti",
  "services.inspection.form.stepOneBody":
    "Raporun kimi destekleyeceğini ve ne kadar hızlı gerektiğini anlamamız için çekirdek bilgileri paylaşın.",
  "services.inspection.form.stepTwoTitle": "Mülk detayları ve son kontrol",
  "services.inspection.form.stepTwoBody":
    "Göndermeden önce mülk bağlamı, fotoğraflar ve onay bilgilerini ekleyin. Bu detaylar isteğe bağlıdır ama faydalıdır.",
  "services.inspection.form.contactTitle": "Kiminle iletişime geçelim?",
  "services.inspection.form.contactBody":
    "Planlama ve takip için en uygun iletişim bilgilerini kullanın.",
  "services.inspection.form.fullNamePlaceholder": "Adınız soyadınız",
  "services.inspection.form.fullNameHelper": "Talebi doğrularken bu adı kullanacağız.",
  "services.inspection.form.phonePlaceholder": "+90 5XX XXX XXXX",
  "services.inspection.form.phoneHelper":
    "Zamanlama veya erişimi hızlıca netleştirebileceğimiz numarayı girin.",
  "services.inspection.form.emailPlaceholder": "name@example.com",
  "services.inspection.form.emailHelper":
    "Yazılı teyit veya takip göndermemiz gerekirse faydalı olur.",
  "services.inspection.form.whatsappHelper":
    "İsteğe bağlı. Hızlı dönüşler, görsel paylaşımı ve canlı koordinasyon için yararlıdır.",
  "services.inspection.form.requestBasicsTitle": "Denetimi nasıl çerçeveleyelim?",
  "services.inspection.form.requestBasicsBody":
    "Bu seçimler, mülk detaylarına geçmeden önce talebi doğru yönlendirmemize ve beklentiyi ayarlamamıza yardımcı olur.",
  "services.inspection.form.requesterTypeHelper":
    "Raporun hangi bakış açısını desteklemesi gerektiğini belirtin.",
  "services.inspection.form.requestTypeHelper":
    "Öncelik vermemizi istediğiniz rapor bağlamını seçin.",
  "services.inspection.form.urgencyHelper":
    "Bu bize sadece planlama sinyali verir; bir slot kilitlemez.",
  "services.inspection.form.continueHint":
    "Sonraki adımda mülk bağlamı, fotoğraflar ve gönderim öncesi son onayı ekleyebilirsiniz.",
  "services.inspection.form.propertyStepTitle": "Mülk detayları ve son kontrol",
  "services.inspection.form.propertyStepBody":
    "Aşağıdaki bilgiler erişim, zaman ve raporlama kapsamını belirlememize yardımcı olur. Bildiklerinizi ekleyin, kalanı boş bırakabilirsiniz.",
  "services.inspection.form.propertyBasicsTitle": "Mülk temelleri",
  "services.inspection.form.propertyBasicsBody":
    "Birkaç lokasyon ve referans detayı ilk değerlendirmeyi genelde hızlandırır.",
  "services.inspection.form.propertyTypeSelect": "Mülk tipini seçin",
  "services.inspection.form.cityPlaceholder": "Şehir",
  "services.inspection.form.districtPlaceholder": "İlçe veya mahalle",
  "services.inspection.form.referenceCodePlaceholder": "İlan veya iç referans",
  "services.inspection.form.referenceCodeHelper":
    "Mülkün mevcut bir ilan kodu veya iç referansı varsa faydalıdır.",
  "services.inspection.form.addressPlaceholder": "Tam adres, bina adı veya pin referansı",
  "services.inspection.form.addressHelper":
    "Tam adres ideal olur; ancak bina adı veya yakın bir landmark da şimdilik yeterlidir.",
  "services.inspection.form.propertyUrlPlaceholder": "https://example.com/listing",
  "services.inspection.form.propertyUrlHelper":
    "İsteğe bağlı. Mülk zaten yayındaysa ilan bağlantısını ekleyin.",
  "services.inspection.form.buildingSnapshotTitle": "Bina özeti",
  "services.inspection.form.buildingSnapshotBody":
    "Bildiğiniz ölçü veya kullanım bilgilerini paylaşabilirsiniz. Bu adım isteğe bağlıdır.",
  "services.inspection.form.grossAreaPlaceholder": "m2",
  "services.inspection.form.netAreaPlaceholder": "m2",
  "services.inspection.form.buildingAgePlaceholder": "Yıl",
  "services.inspection.form.floorNumberPlaceholder": "Bulunduğu kat",
  "services.inspection.form.totalFloorsPlaceholder": "Binadaki toplam kat",
  "services.inspection.form.notesPlaceholder":
    "Ziyaretin sorunsuz ilerlemesine yardımcı olacak her şeyi ekleyin: görünen sorunlar, erişim notları, ideal zamanlama veya özel hassasiyetler.",
  "services.inspection.form.notesHelper":
    "İsteğe bağlı. Görünen sorunlar, karar tarihi, erişim notları veya eksperin önceden bilmesi gereken bilgileri yazabilirsiniz.",
  "services.inspection.form.photosHelper":
    "İsteğe bağlı. Birkaç genel fotoğraf veya ekran görüntüsü, görünen sorunları daha hızlı anlamamıza yardımcı olur.",
  "services.inspection.form.noPhotosYet": "Henüz fotoğraf eklenmedi. Fotoğrafsız da gönderebilirsiniz.",
  "services.inspection.form.finalChecksBody":
    "Bu talep hakkında sizinle iletişime geçebileceğimizi doğrulayın. Pazarlama onayı isteğe bağlı kalır.",
  "services.inspection.form.successNext":
    "Talebi inceler, zamanlama, erişim ve rapor kapsamını doğrulamak için sizinle iletişime geçeriz.",
  "services.inspection.form.keepChatOpen": "Eklemek istediğiniz başka bir şey var mı?",
  "services.inspection.form.successWhatsAppHint":
    "Erişim notları, fotoğraflar veya zamanlama güncellemeleri paylaşmak isterseniz WhatsApp’tan devam edebilirsiniz.",

  // inspection-landing
  "services.inspection.landing.heroEyebrow": "Ticari netlikle due diligence",
  "services.inspection.landing.heroPoint1": "Yapılandırılmış saha kontrol listesi",
  "services.inspection.landing.heroPoint2": "Risk bandı içeren ağırlıklı skor",
  "services.inspection.landing.heroPoint3": "Fiyatlama ve onarım için pratik rapor",
  "services.inspection.landing.decision1Title": "Alıcılar ve yatırımcılar için",
  "services.inspection.landing.decision1Body":
    "Fiyata, capex’e veya pazarlık stratejisine bağlanmadan önce görünen durum sorunlarını anlayın.",
  "services.inspection.landing.decision2Title": "İlana hazırlanan mal sahipleri için",
  "services.inspection.landing.decision2Body":
    "Gösterimleri, yeniden pazarlığı veya alıcı güvenini en çok yavaşlatabilecek kusurları önceliklendirin.",
  "services.inspection.landing.decision3Title": "Uzaktan due diligence için",
  "services.inspection.landing.decision3Body":
    "Mülkü kendiniz inceleyemediğinizde, saha seviyesinde yapılandırılmış bir görünüm alın.",
  "services.inspection.landing.heroCardTitle": "Bu hizmet hangi sorulara cevap vermek için tasarlandı",
  "services.inspection.landing.heroCardPoint1":
    "Görünen durum, istenen fiyat anlatısından daha mı güçlü yoksa daha mı zayıf?",
  "services.inspection.landing.heroCardPoint2":
    "Hangi sorunlar fiyatı, pazarlığı veya kısa vadeli capex’i etkiliyor?",
  "services.inspection.landing.heroCardPoint3":
    "İlerlemeden önce varlığın hangi kısımları uzman takibi gerektiriyor?",
  "services.inspection.landing.heroTitleStrong":
    "Para ve zaman riske girmeden önce neyi satın aldığınızı, düzelttiğinizi veya ilana çıkardığınızı bilin",
  "services.inspection.landing.valueEyebrow": "Müşteriler bunu neden talep ediyor",
  "services.inspection.landing.valueHeading":
    "Sadece gözlem değil, gerçek kararları destekleyen bir rapor",
  "services.inspection.landing.reviewHeading": "Sahada neleri inceliyoruz",
  "services.inspection.landing.reviewSubtitle":
    "Denetim, riski, fiyatlamayı, onarımları ve güveni en çok etkileme ihtimali olan varlık bölümleri etrafında yapılandırılır.",
  "services.inspection.landing.review1Title": "Yapı ve görünür bina bütünlüğü",
  "services.inspection.landing.review1Body":
    "Temel, çatlaklar, duvarlar, çatı hatları, nem sinyalleri ve varlığa güveni etkileyen görünür göstergeler.",
  "services.inspection.landing.review2Title": "Tesisat ve servis sistemleri",
  "services.inspection.landing.review2Body":
    "Gizli devam maliyetleri doğurabilecek sıhhi tesisat, drenaj, ısıtma, sıcak su ve diğer görünür servis bileşenleri.",
  "services.inspection.landing.review3Title": "Elektrik ve güvenlik sinyalleri",
  "services.inspection.landing.review3Body":
    "Görünür tesisat kalitesi, pano durumu, topraklama sinyalleri ve pratik güvenlik gözlemleri.",
  "services.inspection.landing.review4Title": "Konfor ve uyumluluk bağlamı",
  "services.inspection.landing.review4Body":
    "Kullanılabilirliği ve yeniden satış güvenini etkileyen pencere, havalandırma, yalıtım, kullanım ipuçları ve görünür mevzuat sinyalleri.",
  "services.inspection.landing.midCtaEyebrow": "Bir sonraki adıma geçin",
  "services.inspection.landing.midCtaTitle":
    "Mülkün finansal önemi varsa, netlik taahhütten önce gelmelidir",
  "services.inspection.landing.midCtaBody":
    "Temel bilgileri şimdi paylaşın; kapsamı, zamanı ve doğru denetim yolunu netleştirelim.",
  "services.inspection.landing.scoreEyebrow": "Puanlama sistemi",
  "services.inspection.landing.scorePoint1":
    "Her bölüm ayrı puanlanır; böylece zayıf yönler genel bir özetin içinde kaybolmaz.",
  "services.inspection.landing.scorePoint2":
    "En yüksek ağırlık yapıda; ardından tesisat, elektrik, konfor ve uyumluluk gelir.",
  "services.inspection.landing.scorePoint3":
    "Toplam skor hızlı bir okuma sunar; notlar ve bulgular ise asıl dikkat gerektiren noktaları gösterir.",
  "services.inspection.landing.scorePoint4":
    "Risk etiketleri, teknik olmayan karar vericilerin aciliyeti hızlıca okumasına yardımcı olur.",
  "services.inspection.landing.riskHeading": "Risk bantları nasıl okunur",
  "services.inspection.landing.riskStrong": "Güçlü",
  "services.inspection.landing.riskStrongBody":
    "Genel olarak tutarlı görünen durum ve sınırlı acil endişe.",
  "services.inspection.landing.riskGood": "İyi",
  "services.inspection.landing.riskGoodBody":
    "Not edilmesi gereken ama yönetilebilir sorunlarla birlikte güçlü genel tablo.",
  "services.inspection.landing.riskAttention": "Dikkat gerektirir",
  "services.inspection.landing.riskAttentionBody":
    "Önemli kalemler bütçeleme, pazarlık veya uzman ekiplerle takip gerektirir.",
  "services.inspection.landing.riskHigh": "Yüksek risk",
  "services.inspection.landing.riskHighBody":
    "Birden fazla görünür sorun veya ciddi risk sinyali, ilerlemeden önce dikkat gerektirir.",
  "services.inspection.landing.previewEyebrow": "Rapor ön gösterimi",
  "services.inspection.landing.previewHeading":
    "Nihai raporun hızlıca görmenize yardımcı olduğu başlıklar",
  "services.inspection.landing.preview1Title": "Yönetici özeti",
  "services.inspection.landing.preview1Body":
    "Genel durum, riskin yoğunlaştığı alanlar ve takip gerektiren noktalar için hızlı özet.",
  "services.inspection.landing.preview2Title": "Bölüm bazlı puanlama",
  "services.inspection.landing.preview2Body":
    "Ağırlıklı bölüm skorları, yapı, tesisat, elektrik ve konfor sorunlarını karşılaştırmayı kolaylaştırır.",
  "services.inspection.landing.preview3Title": "Temel bulgular",
  "services.inspection.landing.preview3Body":
    "Başlıca gözlemler, önem derecesi ve neden ticari olarak önemli olduklarına dair net notlar.",
  "services.inspection.landing.preview4Title": "Onarım ve aksiyon öncelikleri",
  "services.inspection.landing.preview4Body":
    "Bütçeleme, pazarlık, düzeltici iş veya uzman incelemesi için pratik sonraki adımlar.",
  "services.inspection.landing.previewScoreLabel": "Örnek skor görünümü",
  "services.inspection.landing.previewMetricStructure": "Yapı",
  "services.inspection.landing.previewMetricUtilities": "Tesisat",
  "services.inspection.landing.previewMetricRisk": "Risk",
  "services.inspection.landing.previewRiskValue": "Dikkat gerektirir",
  "services.inspection.landing.processEyebrow": "Teslim akışı",
  "services.inspection.landing.bottomCtaEyebrow": "Başlamaya hazır mısınız",
  "services.inspection.landing.bottomCtaTitle":
    "Gizli sorunlar kararı sizin yerinize şekillendirmeden önce denetimi talep edin",
  "services.inspection.landing.ctaSample": "Örnek raporu inceleyin",

  // staging-form
  "services.staging.form.eyebrow": "Hedefle başlayın",
  "services.staging.form.introTitle":
    "Detaylara girmeden önce mülkün neyi başarmasını istediğinizi bize anlatın.",
  "services.staging.form.introBody":
    "İlk adım iletişim bilgileri, ticari hedef ve kapsamı toplar. Mülk detayları sonra gelebilir.",
  "services.staging.form.stepOneTitle": "İletişim ve ticari hedef",
  "services.staging.form.stepOneBody":
    "Hedefinizi, tercih ettiğiniz bütçe aralığını, zamanlamayı ve bildiğiniz hizmet ihtiyaçlarını paylaşın.",
  "services.staging.form.stepTwoTitle": "Mülk detayları ve son kontrol",
  "services.staging.form.stepTwoBody":
    "Göndermeden önce varlık detaylarını, notları, fotoğrafları ve son onayı ekleyin.",
  "services.staging.form.contactTitle": "Kiminle iletişime geçelim?",
  "services.staging.form.contactBody":
    "Hızlı takip, bütçe netliği ve planlama için en iyi iletişim bilgilerini kullanın.",
  "services.staging.form.fullNamePlaceholder": "Adınız soyadınız",
  "services.staging.form.fullNameHelper": "Proje brifini doğrularken bu adı kullanacağız.",
  "services.staging.form.phonePlaceholder": "+90 5XX XXX XXXX",
  "services.staging.form.phoneHelper":
    "Brif zaman açısından hassassa aynı gün dönüş için en uygun numara.",
  "services.staging.form.emailPlaceholder": "name@example.com",
  "services.staging.form.emailHelper":
    "Yazılı özet, paket önerisi veya takip göndermemiz gerekirse faydalı olur.",
  "services.staging.form.whatsappHelper":
    "İsteğe bağlı. Hızlı koordinasyon, moodboard bağlantıları ve görsel referanslar için uygundur.",
  "services.staging.form.intentTitle": "Proje hedefi",
  "services.staging.form.intentBody":
    "Ticari hedef ve kabaca kapsamla başlayın. Böylece daha faydalı bir ilk öneriyle dönebiliriz.",
  "services.staging.form.ownerTypeHelper":
    "Varlıktaki rolünüzü en iyi yansıtan seçeneği belirleyin.",
  "services.staging.form.targetGoalHelper":
    "İsteğe bağlıdır; ancak satış, kiralama veya portföy kararına bağlı briflerde faydalıdır.",
  "services.staging.form.budgetHelper":
    "İsteğe bağlı. Yaklaşık bir bütçe, daha gerçekçi bir ilk kapsam önermemize yardımcı olur.",
  "services.staging.form.timelineHelper":
    "İsteğe bağlı. Mülkün belirli bir tarihe kadar pazara hazır olması gerekiyorsa yararlıdır.",
  "services.staging.form.servicesHelper":
    "Şimdiden ihtiyaç duyduğunuzu düşündüğünüz hizmetlerin hepsini seçin. Yönlendirme istiyorsanız geniş bırakabilirsiniz.",
  "services.staging.form.continueHint":
    "Sonraki adımda mülk detaylarını, notları, fotoğrafları ve son onayı ekleyebilirsiniz.",
  "services.staging.form.propertyStepTitle": "Mülk detayları ve son kontrol",
  "services.staging.form.propertyStepBody":
    "Bildiklerinizi ekleyin. Bazı alanlar boş kalsa da brif yine gönderilebilir.",
  "services.staging.form.propertyBasicsTitle": "Mülk temelleri",
  "services.staging.form.propertyBasicsBody":
    "Lokasyon ve varlık detayları, nasıl bir kapsamın gerçekçi olduğunu değerlendirmemize yardımcı olur.",
  "services.staging.form.cityPlaceholder": "Şehir",
  "services.staging.form.districtPlaceholder": "İlçe veya mahalle",
  "services.staging.form.addressPlaceholder": "Tam adres, bina adı veya landmark",
  "services.staging.form.propertyTypePlaceholder": "Daire, villa, ofis...",
  "services.staging.form.propertySizePlaceholder": "m2",
  "services.staging.form.propertySizeHelper":
    "İsteğe bağlı. Alan bilgisi, staging veya yenileme kapsamının ne kadar geniş olabileceğini anlamamıza yardımcı olur.",
  "services.staging.form.roomCountPlaceholder": "2+1, 3 yatak odası, stüdyo...",
  "services.staging.form.propertyUrlPlaceholder": "https://example.com/listing",
  "services.staging.form.propertyUrlHelper":
    "İsteğe bağlı. Mülk yayındaysa ilan bağlantısını ekleyin.",
  "services.staging.form.assetStateTitle": "Varlık durumu ve notlar",
  "services.staging.form.assetStateBody":
    "Bu bölüm, işin daha çok styling, iyileştirme veya ikisinin karışımı mı olduğunu anlamamıza yardımcı olur.",
  "services.staging.form.notesPlaceholder":
    "Brif için önemli olan her şeyi ekleyin: mevcut sorunlar, hedef alıcı veya kiracı, ilan tarihi ya da en çok iyileştirme gereken alanlar.",
  "services.staging.form.notesHelper":
    "İsteğe bağlı. Alıcı profili, ilan tarihi, zayıf odalar veya vazgeçilmeyecek konular için en doğru alan burasıdır.",
  "services.staging.form.photosHelper":
    "İsteğe bağlı. Birkaç mevcut fotoğraf, ilk adımın styling, hafif yenileme, içerik üretimi veya bunların karışımı olup olmadığını anlamamıza yardım eder.",
  "services.staging.form.noPhotosYet": "Henüz fotoğraf eklenmedi. Fotoğrafsız da brifi gönderebilirsiniz.",
  "services.staging.form.finalChecksBody":
    "Bu brif hakkında sizinle iletişime geçebileceğimizi doğrulayın. Pazarlama onayı isteğe bağlı kalır.",
  "services.staging.form.successNext":
    "Önce hedefi, bütçeyi ve zamanlamayı inceler; ardından en uygun sonraki adımla dönüş yaparız.",
  "services.staging.form.keepChatOpen": "Referans veya bağlantı eklemek ister misiniz?",
  "services.staging.form.successWhatsAppHint":
    "İlan bağlantıları, görsel referanslar veya güncellenen öncelikleri paylaşmak için WhatsApp’tan devam edebilirsiniz.",

  // staging-landing
  "services.staging.landing.heroEyebrow": "Dönüşümü destekleyen sunum",
  "services.staging.landing.heroTitleStrong":
    "İyi bir mülkü, güvenmesi, gezmesi ve seçmesi daha kolay görünen bir ilana dönüştürün",
  "services.staging.landing.heroChip1": "Staging yönü",
  "services.staging.landing.heroChip2": "Hafif yenileme kapsamı",
  "services.staging.landing.heroChip3": "Premium fotoğraf ve video içeriği",
  "services.staging.landing.heroCardTitle": "Bu hizmet neleri kapsayabilir",
  "services.staging.landing.heroCardPoint1":
    "Fotoğraflarda daha büyük, daha temiz ve daha premium görünen odalar",
  "services.staging.landing.heroCardPoint2":
    "Tam renovasyondan daha net görünür ROI sunan hedefli kozmetik iyileştirmeler",
  "services.staging.landing.heroCardPoint3":
    "Uluslararası ve uzaktaki alıcıların mülkü daha hızlı değerlendirmesine yardımcı pazarlama varlıkları",
  "services.staging.landing.scopeEyebrow": "Hizmet kapsamı",
  "services.staging.landing.scopeTitle":
    "Staging, kozmetik işler ve premium içerik arasında daha net ayrım",
  "services.staging.landing.benefit1Title": "Daha güçlü bir ilan isteyen mal sahipleri için",
  "services.staging.landing.benefit1Body":
    "Görsel güveni artırın, \"iş istiyor\" algısını azaltın ve varlığı çevrimiçi ve gösterimlerde daha net sunun.",
  "services.staging.landing.benefit2Title": "Hız ve değere odaklanan yatırımcılar için",
  "services.staging.landing.benefit2Body":
    "Sunum açığının talep veya fiyat gücüne zarar verdiği yerlerde staging, kozmetik iyileştirme ve medyaya hedefli bütçe kullanın.",
  "services.staging.landing.benefit3Title": "Tahmin değil, net kapsam isteyen ekipler için",
  "services.staging.landing.benefit3Body":
    "Projeyi ticari olarak anlamlı tutmak için basit sunum düzeltmeleri ile daha ağır işleri ayırmaya yardımcı oluruz.",
  "services.staging.landing.midCtaEyebrow": "Önce / sonra fark yaratır",
  "services.staging.landing.midCtaTitle":
    "Varlıkta zaten talep potansiyeli varsa, sunum genelde en hızlı kaldıraçtır",
  "services.staging.landing.midCtaBody":
    "Kalite seviyesini vitrinden kıyaslayın, sonra hedef ve bütçenize uygun kapsamı talep edin.",
  "services.staging.landing.packagesSubtitle":
    "Yayınlanan paketler kapsamın, zamanın ve teslimatların nasıl yapılandırılabileceğini gösterir. Nihai kapsam inceleme sonrasında netleşir.",
  "services.staging.landing.packagesLink": "Size özel kapsam talep edin",
  "services.staging.landing.packagesFallbackTitle":
    "Kapsam hâlâ açıksa paketler projeye göre şekillendirilir",
  "services.staging.landing.processEyebrow": "Süreç",
  "services.staging.landing.processTitle": "Staging ve yenileme kapsamı nasıl şekillendirilir",
  "services.staging.landing.step1Title": "Brif ve mülk değerlendirmesi",
  "services.staging.landing.step1Body":
    "Doğru müdahale seviyesini belirlemek için hedefinizi, varlık durumunu, fotoğrafları ve zamanlamayı inceleriz.",
  "services.staging.landing.step2Title": "Kapsam ve paket önerisi",
  "services.staging.landing.step2Body":
    "Staging, hafif yenileme, medya üretimi veya bunların birleşimi için daha net bir plan alırsınız.",
  "services.staging.landing.step3Title": "Uygulama ve içerik teslimi",
  "services.staging.landing.step3Body":
    "Mülk hazırlanır, çekilir ve satış veya kiralama pazarlaması için daha güçlü görsel güvenle konumlandırılır.",
  "services.staging.landing.packageCategories.visual-refresh.label": "Görsel yenileme",
  "services.staging.landing.packageCategories.visual-refresh.summary":
    "Sunum kalitesi, daha temiz görseller ve daha hızlı ilan hazırlığına odaklanan daha hafif kapsam.",
  "services.staging.landing.packageCategories.sale-ready.label": "Satışa hazır",
  "services.staging.landing.packageCategories.sale-ready.summary":
    "Seçici yenileme, staging ve medyayı birleştirerek fiyat gücünü artıran daha geniş paket.",
  "services.staging.landing.packageCategories.premium-boost.label": "Premium destek",
  "services.staging.landing.packageCategories.premium-boost.summary":
    "Bitiş kalitesi, içerik ve görünürlüğün birlikte yükselmesi gereken varlıklar için premium lansman kapsamı.",
  "services.staging.landing.packageCategories.custom.label": "Özel kapsam",
  "services.staging.landing.packageCategories.custom.summary":
    "Varlık, zamanlama ve ticari hedef etrafında kurgulanan özel kapsam.",
  "services.staging.landing.packageCategories.default.summary":
    "Kapsam, varlığa, görünürlük hedefine ve teslim süresine göre uyarlanır.",
  "services.staging.landing.packageOrderLabel": "Paket",
  "services.staging.landing.packageDaysSuffix": "gün",
  "services.staging.landing.packageMetaBudget": "Gösterge bütçe",
  "services.staging.landing.packageMetaCustom": "Özel",
  "services.staging.landing.packageMetaTimeline": "Tahmini süre",
  "services.staging.landing.packageMetaFlexible": "Kapsama göre değişir",
  "services.staging.landing.packageMetaIncluded": "Dahil hizmetler",
  "services.staging.landing.packageServicesSuffix": "kalem",
  "services.staging.landing.packageFitTitle": "Bu paket nerede uygun",
  "services.staging.landing.packageCta": "Bu paketi konuşalım",
  "services.staging.landing.budgetPoint1":
    "Daha küçük kapsamlar genelde styling, düzenleme ve medya üretimine odaklanır.",
  "services.staging.landing.budgetPoint2":
    "Orta ölçekli kapsamlar genelde sunum çalışmasını seçici kozmetik iyileştirmelerle birleştirir.",
  "services.staging.landing.budgetPoint3":
    "Daha büyük kapsamlar, varlığın algısını gerçekten değiştiren görünür iyileştirmeler için ayrılmalıdır.",
  "services.staging.landing.timelineCard1Label": "Tipik hızlı kapsam",
  "services.staging.landing.timelineCard1Value": "Günlerden birkaç haftaya",
  "services.staging.landing.timelineCard2Label": "Daha geniş kapsam",
  "services.staging.landing.timelineCard2Value": "Çok adımlı planlama ve uygulama",
  "services.staging.landing.ctaProjects": "Dönüşümleri görün",
  "services.staging.landing.bottomCtaEyebrow": "Projeyi anlatmaya hazır mısınız",
  "services.staging.landing.bottomCtaTitle":
    "Varlık, hedef ve zaman çizelgesiyle başlayın. Kalanını sizinle birlikte şekillendirebiliriz.",

  // staging-projects
  "services.staging.projectsPage.eyebrow": "Yayınlanan dönüşümler",
  "services.staging.projectsPage.countLabel": "Yayınlanan vaka çalışmaları",
  "services.staging.projectsPage.ctaRequest": "Danışmanlık talep et",
  "services.staging.projectsPage.emptyTitle":
    "Yayınlanan staging projeleri canlıya alındıkça burada görünecek",
  "services.staging.projectsPage.emptyBody":
    "Bu vitrin yalnızca admin tarafında yayınlanan projeleri kullanır. Henüz canlı proje yoksa yine de danışmanlık talebi bırakabilir, doğru kapsam için öneri alabilirsiniz.",
  "services.staging.projectsPage.previewLabel": "Yayınlanan proje",
  "services.staging.projectsPage.metaFallback": "Talep üzerine paylaşılır",
  "services.staging.projectsPage.timelineFallback": "Kapsama göre değişir",
  "services.staging.projectsPage.budgetFallback": "Projeye göre belirlenir",
  "services.staging.projectsPage.beforeAfterReady": "Önce / sonra medyası yayında",

  // staging-project-detail
  "services.staging.projectDetail.beforeAlt": "{{title}} öncesi",
  "services.staging.projectDetail.afterAlt": "{{title}} sonrası",
  "services.staging.projectDetail.notFoundBody":
    "Bu proje yayından kaldırılmış, yeniden adlandırılmış ya da kamuya açık görünüm için uygun olmayabilir.",
  "services.staging.projectDetail.ctaConsultation": "Danışmanlık talep et",
  "services.staging.projectDetail.beforeAfterEyebrow": "Önce / sonra karşılaştırması",
  "services.staging.projectDetail.beforeAfterTitle": "Ana dönüşüm görünümü",
  "services.staging.projectDetail.mediaPendingTitle": "Önce / sonra medyası burada görünecek",
  "services.staging.projectDetail.mediaPendingBody":
    "Bu proje yayında; ancak kamuya açık karşılaştırma medyası henüz eklenmedi.",
  "services.staging.projectDetail.galleryTitle": "Ek önce / sonra görünümleri",
  "services.staging.projectDetail.galleryBody":
    "Ek görünümler, kapsamın mülkün farklı alanlarına nasıl yayıldığını göstermeye yardımcı olur.",
  "services.staging.projectDetail.testimonialEyebrow": "Müşteri bakışı",
  "services.staging.projectDetail.testimonialTitle": "Referans",
  "services.staging.projectDetail.mediaLinksTitle": "Yayınlanan medya bağlantıları",
  "services.staging.projectDetail.mediaLink.virtualTour": "Sanal tur",
  "services.staging.projectDetail.mediaLink.droneFootage": "Drone çekimi",
  "services.staging.projectDetail.mediaLink.floorPlan": "Kat planı",
  "services.staging.projectDetail.openLink": "Medyayı aç",
  "services.staging.projectDetail.packageEyebrow": "Paket bağlamı",
  "services.staging.projectDetail.packageTitle": "Seçilen paket",
  "services.staging.projectDetail.metricsTitle": "Yayınlanan sonuç sinyalleri",
  "services.staging.projectDetail.consultationEyebrow": "Benzer bir kapsamı konuşalım",
  "services.staging.projectDetail.consultationTitle":
    "Mülkünüzü kısaca anlatın; doğru staging veya yenileme seviyesini önerelim.",
  "services.staging.projectDetail.consultationBody":
    "Varlığı, zamanlamayı ve hedef sonucu paylaşın. Vitrindeki örnekler gerçektir; ancak her kapsam yine mülke göre eşleştirilir.",
  "services.staging.projectDetail.minimalState":
    "Bu yayınlanan projede şu anda sınırlı sayıda kamuya açık alan bulunuyor. Admin tarafına daha fazla medya ve anlatı eklendikçe sayfa otomatik olarak zenginleşir.",

  // staging-enums
  "services.enums.staging.service.decluttering": "Düzenleme ve fazlalıkların kaldırılması",
  "services.enums.staging.service.deep_cleaning": "Derin temizlik",
  "services.enums.staging.service.minor_repairs": "Küçük onarımlar",
  "services.enums.staging.service.painting": "Boya",
  "services.enums.staging.service.furniture_rental": "Mobilya kiralama",
  "services.enums.staging.service.accessory_styling": "Aksesuar stil düzeni",
  "services.enums.staging.service.professional_photography": "Profesyonel fotoğraf çekimi",
  "services.enums.staging.service.videography": "Video çekimi",
  "services.enums.staging.service.drone_footage": "Drone çekimi",
  "services.enums.staging.service.virtual_tour_360": "360 sanal tur",
  "services.enums.staging.service.floor_plan_2d": "2D kat planı",
  "services.enums.staging.service.floor_plan_3d": "3D kat planı",
  "services.enums.staging.service.social_media_content": "Sosyal medya içeriği",
  "services.enums.staging.service.listing_copywriting": "İlan metni yazımı",
  "services.enums.staging.service.home_staging_full": "Tam home staging",
  "services.enums.staging.service.renovation_light": "Hafif yenileme",
  "services.enums.staging.service.renovation_full": "Kapsamlı yenileme",
  "services.privatePanel.eyebrow": "Özel talep paneli",
  "services.privatePanel.title": "Hizmet Taleplerim",
  "services.privatePanel.subtitle":
    "Staging, renovasyon ve denetim taleplerinizi tek bir yerde görün.",
  "services.privatePanel.refresh": "Yenile",
  "services.privatePanel.loadError": "Talepleriniz yüklenemedi.",
  "services.privatePanel.emptyTitle": "Henüz talep yok",
  "services.privatePanel.emptyBody":
    "Staging, renovasyon ve denetim talepleriniz gönderimden sonra burada görünecek.",
  "services.privatePanel.ctaStaging": "Staging talebi gönder",
  "services.privatePanel.ctaInspection": "Denetim talebi gönder",
  "services.privatePanel.stagingSectionTitle": "Staging ve Renovasyon",
  "services.privatePanel.stagingSectionBody":
    "Şirketten gelen sunum, renovasyon ve proje güncellemeleri.",
  "services.privatePanel.inspectionSectionTitle": "Denetim Talepleri",
  "services.privatePanel.inspectionSectionBody":
    "Denetim talebi durumu, puan ve rapor güncellemeleri.",
  "services.privatePanel.stagingLabel": "Staging / Renovasyon",
  "services.privatePanel.stagingFallbackTitle": "Staging / renovasyon talebi",
  "services.privatePanel.inspectionLabel": "Denetim",
  "services.privatePanel.inspectionFallbackTitle": "Mülk denetim talebi",
  "services.privatePanel.submittedOn": "Gönderim",
  "services.privatePanel.projectLabel": "Proje",
  "services.privatePanel.reportLabel": "Rapor",
  "services.privatePanel.requestSummary": "Talebiniz",
  "services.privatePanel.goal": "Hedef",
  "services.privatePanel.requestBudget": "Bütçe",
  "services.privatePanel.requestTimeline": "Zaman planı",
  "services.privatePanel.property": "Mülk",
  "services.privatePanel.requestedServices": "Talep edilen hizmetler",
  "services.privatePanel.yourNotes": "Notlarınız",
  "services.privatePanel.companyUpdate": "Şirket güncellemesi",
  "services.privatePanel.visitChecklist": "Ziyaret checklisti",
  "services.privatePanel.visitScheduled": "Mülk ziyareti planlandı",
  "services.privatePanel.visitScheduledBody":
    "Şirket mülk ziyaret saatinizi paylaştı. Aşağıda takvimi ve notu inceleyin.",
  "services.privatePanel.visitDateTime": "Ziyaret saati",
  "services.privatePanel.visitLocation": "Konum",
  "services.privatePanel.visitNote": "Checklist notu",
  "services.privatePanel.companyBudget": "Şirket tahmini",
  "services.privatePanel.companyTimeline": "Çalışma takvimi",
  "services.privatePanel.scope": "Güncel kapsam",
  "services.privatePanel.metricValueUplift": "Değer artışı",
  "services.privatePanel.metricRentalUplift": "Kira artışı",
  "services.privatePanel.metricSaleSpeed": "Satış hızı",
  "services.privatePanel.metricSaleSpeedValue": "{{days}} gün daha hızlı",
  "services.privatePanel.viewPublicShowcase": "Açık vitrini görüntüle",
  "services.privatePanel.privateOnly": "Yayınlanana kadar yalnızca özel hesabınızda görünür.",
  "services.privatePanel.pendingCompanyUpdate":
    "Şirket henüz resmi bir proje güncellemesi eklemedi.",
  "services.privatePanel.requestType": "Talep tipi",
  "services.privatePanel.urgency": "Aciliyet",
  "services.privatePanel.requester": "Talep sahibi",
  "services.privatePanel.referenceCode": "Referans",
  "services.privatePanel.scheduleLabel": "Planlama",
  "services.privatePanel.inspectionScore": "Denetim puanı",
  "services.privatePanel.riskLabel": "Risk etiketi",
  "services.privatePanel.reportStatus": "Rapor durumu",
  "services.privatePanel.updatedLabel": "Son güncelleme",
  "services.privatePanel.sectionScores": "Bölüm puanları",
  "services.privatePanel.propertyOutcome": "Mülkünüz için planlanan değişiklik",
  "services.privatePanel.recommendation": "Öneri",
  "services.privatePanel.beforePhotos": "Önce",
  "services.privatePanel.afterPhotos": "Sonra",
  "services.privatePanel.beforePhotoAlt": "Önce mülk önizlemesi {{index}}",
  "services.privatePanel.afterPhotoAlt": "Sonra mülk önizlemesi {{index}}",
  "services.privatePanel.noBeforePreview": "Öncesine ait görsel henüz yüklenmedi",
  "services.privatePanel.noAfterPreview": "Sonrasına ait görsel henüz yüklenmedi",
  "services.privatePanel.keyFindings": "Temel bulgular",
  "services.privatePanel.repairEstimates": "Onarım tahminleri",
  "services.privatePanel.openReportFile": "Rapor dosyasını aç",
  "services.privatePanel.pendingInspectionUpdate":
    "Şirket henüz checklist veya rapor güncellemesi eklemedi.",
  "services.privatePanel.inspectionSections.structuralSafety": "Yapısal güvenlik",
  "services.privatePanel.inspectionSections.legalCompliance": "Yasal uygunluk",
  "services.privatePanel.inspectionSections.utilitiesPlumbing": "Tesisat ve su sistemi",
  "services.privatePanel.inspectionSections.electricalSafety": "Elektrik güvenliği",
  "services.privatePanel.inspectionSections.comfortInsulation": "Konfor ve yalıtım",
  "services.privatePanel.scoreTone.strong": "Çok iyi durumda",
  "services.privatePanel.scoreTone.good": "İyi durumda",
  "services.privatePanel.scoreTone.needs_attention": "Dikkat gerekiyor",
  "services.privatePanel.scoreTone.high_risk": "Yüksek risk",
  "services.privatePanel.scoreTone.pending": "Beklemede",
  "services.privatePanel.riskValue.strong": "Düşük risk",
  "services.privatePanel.riskValue.good": "Orta seviye risk",
  "services.privatePanel.riskValue.needs_attention": "Dikkat gerekiyor",
  "services.privatePanel.riskValue.high_risk": "Yüksek risk",
  "services.privatePanel.riskValue.medium_risk": "Orta risk",
  "services.privatePanel.riskValue.low_risk": "Düşük risk",
  "services.privatePanel.riskValue.pending": "Beklemede",
  "services.privatePanel.reportStatusValue.draft": "Taslak",
  "services.privatePanel.reportStatusValue.review": "İncelemede",
  "services.privatePanel.reportStatusValue.final": "Nihai",
  "services.privatePanel.reportStatusValue.delivered": "Teslim edildi",
  "services.privatePanel.findingSeverity.low": "Düşük",
  "services.privatePanel.findingSeverity.medium": "Orta",
  "services.privatePanel.findingSeverity.high": "Yüksek",
  "services.privatePanel.findingSeverity.critical": "Kritik",
  "services.privatePanel.findingSeverity.none": "Yok",
  "services.privatePanel.findingStatus.good": "İyi",
  "services.privatePanel.findingStatus.acceptable": "Kabul edilebilir",
  "services.privatePanel.findingStatus.risky": "Riskli",
  "services.privatePanel.findingStatus.critical": "Kritik",
  "services.privatePanel.findingStatus.not_checked": "Kontrol edilmedi",
  "services.privatePanel.status.new": "Yeni",
  "services.privatePanel.status.qualified": "Değerlendirildi",
  "services.privatePanel.status.proposal_sent": "Teklif gönderildi",
  "services.privatePanel.status.approved": "Onaylandı",
  "services.privatePanel.status.planning": "Planlanıyor",
  "services.privatePanel.status.in_progress": "Devam ediyor",
  "services.privatePanel.status.content_pending": "İçerik bekleniyor",
  "services.privatePanel.status.completed": "Tamamlandı",
  "services.privatePanel.status.published": "Yayında",
  "services.privatePanel.status.closed": "Kapatıldı",
  "services.privatePanel.status.cancelled": "İptal edildi",
  "services.privatePanel.status.contacted": "İletişime geçildi",
  "services.privatePanel.status.scheduled": "Planlandı",
  "services.privatePanel.status.in_review": "İnceleniyor",
  "services.privatePanel.status.inspection_completed": "Denetim tamamlandı",
  "services.privatePanel.status.report_drafting": "Rapor hazırlanıyor",
  "services.privatePanel.status.report_ready": "Rapor hazır",
  "services.privatePanel.status.delivered": "Teslim edildi",
  "services.privatePanel.status.on_hold": "Beklemede",
};

const ruFlatMap = {
  // common
  "services.common.back": "Назад",
  "services.common.backToStepOne": "Вернуться к шагу 1",
  "services.common.continue": "Продолжить",
  "services.common.file": "Файл",
  "services.common.finalChecks": "Финальная проверка",
  "services.common.fixHighlightedFields": "Проверьте выделенные поля.",
  "services.common.invalidNonNegativeNumber": "Введите ноль или положительное число.",
  "services.common.invalidPositiveNumber": "Введите корректное положительное число.",
  "services.common.invalidUrl": "Введите корректный URL.",
  "services.common.nextStepTitle": "Что дальше",
  "services.common.propertyTypes.apartment": "Квартира",
  "services.common.propertyTypes.villa": "Вилла",
  "services.common.propertyTypes.office": "Офис",
  "services.common.propertyTypes.commercial": "Коммерческая недвижимость",
  "services.common.propertyTypes.land": "Земля",
  "services.common.propertyTypes.building": "Здание",
  "services.common.remove": "Удалить",
  "services.common.stepOne": "Шаг 1",
  "services.common.stepTwo": "Шаг 2",
  "services.common.waitForUpload": "Сначала дождитесь загрузки фото",

  // hub
  "services.hub.heroEyebrow": "Коммерческая поддержка для более точных решений по объекту",
  "services.hub.heroTitle": "Инспекция и подача объекта, построенные вокруг реальных сделок",
  "services.hub.heroSubtitle":
    "Услуги HB Real Estate помогают покупателям снижать скрытый риск, а собственникам — представлять объект убедительнее, с понятными направлениями по инспекции и стейджингу.",
  "services.hub.heroChip1": "Независимый процесс инспекции",
  "services.hub.heroChip2": "Поддержка продажи через подачу объекта",
  "services.hub.heroChip3": "Координация на трёх языках",
  "services.hub.heroPrimaryCta": "Заказать инспекцию",
  "services.hub.heroSecondaryCta": "Запланировать проект стейджинга",
  "services.hub.comparisonEyebrow": "Выберите правильный путь",
  "services.hub.comparisonTitle": "Две услуги, две разные коммерческие задачи",
  "services.hub.comparisonSubtitle":
    "Инспекцию выбирают, когда нужна ясность по состоянию и риску. Стейджинг выбирают, когда нужен более сильный первый образ и более убедительная история листинга.",
  "services.hub.comparisonLink": "Обсудить ваш объект",
  "services.hub.benefit1Title": "Снизьте неопределённость до вложений или выхода в листинг",
  "services.hub.benefit1Body":
    "Используйте инспекцию и работу над подачей объекта, чтобы принимать более точные решения по цене, ремонту и срокам.",
  "services.hub.benefit2Title": "Усильте доверие покупателя и результативность листинга",
  "services.hub.benefit2Body":
    "Понятный отчёт о состоянии и более сильная подача помогают серьёзным покупателям двигаться вперёд с меньшими сомнениями.",
  "services.hub.benefit3Title": "Быстрее определить правильный следующий шаг",
  "services.hub.benefit3Body":
    "Независимо от того, нужен ли вам due diligence или подача объекта перед продажей, путь услуги остаётся понятным уже с первого разговора.",
  "services.hub.cardInspectionLong":
    "Независимая выездная проверка со структурированными заметками, взвешенным скорингом и отчётом, удобным для решений покупателей, собственников и инвесторов.",
  "services.hub.cardInspectionCta": "Открыть инспекцию",
  "services.hub.cardInspectionPoint1": "Подходит для проверки перед покупкой и оценки рисков",
  "services.hub.cardInspectionPoint2": "Проясняет состояние, приоритеты и вероятный capex",
  "services.hub.cardInspectionPoint3": "Включает логику скоринга и структуру отчёта",
  "services.hub.cardStagingLong":
    "Стейджинг, лёгкая реновация и премиальный маркетинговый контент, которые усиливают первое впечатление и помогают листингу конвертироваться быстрее.",
  "services.hub.cardStagingCta": "Открыть стейджинг",
  "services.hub.cardStagingPoint1": "Подходит собственникам, готовящим объект к продаже или аренде",
  "services.hub.cardStagingPoint2": "Объединяет подачу, медиа и практичные улучшения",
  "services.hub.cardStagingPoint3": "Масштабируется от визуального обновления до премиальной витрины",
  "services.hub.processEyebrow": "Как это работает",
  "services.hub.processTitle": "Простой вход, практический результат",
  "services.hub.step1Title": "Выберите правильную услугу",
  "services.hub.step1Body":
    "Инспекция помогает понять состояние и риск. Стейджинг помогает усилить подачу и рыночный отклик.",
  "services.hub.step2Title": "Поделитесь базовой информацией об объекте",
  "services.hub.step2Body":
    "Сначала отправьте ключевые данные. Дополнительные фото, ссылки и сроки можно добавить после первичной оценки объёма.",
  "services.hub.step3Title": "Получите практический следующий шаг",
  "services.hub.step3Body":
    "Мы ведём вас к отчёту, плану подачи объекта или чётко сформированному сервисному предложению.",
  "services.hub.trustEyebrow": "Почему клиенты начинают здесь",
  "services.hub.trustTitle": "Более понятный путь от неопределённости к действию",
  "services.hub.trustBody":
    "Эти услуги отвечают на практические коммерческие вопросы: что я на самом деле покупаю, что стоит исправить до выхода на рынок и как улучшить подачу объекта без лишнего объёма работ.",
  "services.hub.trustPoint1": "Независимая оценка состояния для покупателей и инвесторов",
  "services.hub.trustPoint2": "Улучшения, ориентированные на подачу, для собственников и девелоперов",
  "services.hub.trustPoint3": "Чёткие следующие шаги вместо расплывчатой консультации",

  // inspection-form
  "services.inspection.form.eyebrow": "Начните с основного",
  "services.inspection.form.introTitle": "Расскажите, кто вы и какая инспекция вам нужна.",
  "services.inspection.form.introBody":
    "Первый шаг собирает ключевые контакты и детали запроса. Информацию об объекте можно добавить дальше.",
  "services.inspection.form.stepOneTitle": "Контакты и суть запроса",
  "services.inspection.form.stepOneBody":
    "Поделитесь базовыми данными, чтобы мы поняли, для кого нужен отчёт и насколько срочно он нужен.",
  "services.inspection.form.stepTwoTitle": "Детали объекта и финальная проверка",
  "services.inspection.form.stepTwoBody":
    "Перед отправкой добавьте контекст объекта, фото и согласия. Эти детали не обязательны, но полезны.",
  "services.inspection.form.contactTitle": "С кем связаться?",
  "services.inspection.form.contactBody":
    "Укажите контакты, которые удобнее всего для согласования выезда и дальнейшей связи.",
  "services.inspection.form.fullNamePlaceholder": "Ваше полное имя",
  "services.inspection.form.fullNameHelper":
    "Это имя мы будем использовать при подтверждении запроса.",
  "services.inspection.form.phonePlaceholder": "+90 5XX XXX XXXX",
  "services.inspection.form.phoneHelper":
    "Номер, по которому мы сможем быстро согласовать время или доступ.",
  "services.inspection.form.emailPlaceholder": "name@example.com",
  "services.inspection.form.emailHelper":
    "Полезно, если потребуется письменное подтверждение или follow-up.",
  "services.inspection.form.whatsappHelper":
    "Необязательно. Удобно для быстрых ответов, обмена изображениями и оперативной координации.",
  "services.inspection.form.requestBasicsTitle": "Как нам выстроить инспекцию?",
  "services.inspection.form.requestBasicsBody":
    "Эти выборы помогают правильно направить запрос и настроить ожидания ещё до разбора деталей объекта.",
  "services.inspection.form.requesterTypeHelper":
    "Подскажите, чью точку зрения должен поддерживать отчёт.",
  "services.inspection.form.requestTypeHelper":
    "Выберите тип отчётного контекста, который для вас важнее всего.",
  "services.inspection.form.urgencyHelper":
    "Это даёт нам сигнал по планированию, но не фиксирует слот.",
  "services.inspection.form.continueHint":
    "Далее вы сможете добавить контекст объекта, фото и финальные согласия перед отправкой.",
  "services.inspection.form.propertyStepTitle": "Детали объекта и финальная проверка",
  "services.inspection.form.propertyStepBody":
    "Всё ниже помогает нам оценить доступ, время и формат отчёта. Добавьте то, что знаете, остальное можно оставить пустым.",
  "services.inspection.form.propertyBasicsTitle": "Базовые данные по объекту",
  "services.inspection.form.propertyBasicsBody":
    "Несколько деталей по локации и референсу обычно ускоряют первичную оценку.",
  "services.inspection.form.propertyTypeSelect": "Выберите тип объекта",
  "services.inspection.form.cityPlaceholder": "Город",
  "services.inspection.form.districtPlaceholder": "Район или квартал",
  "services.inspection.form.referenceCodePlaceholder": "Код листинга или внутренний референс",
  "services.inspection.form.referenceCodeHelper":
    "Полезно, если у объекта уже есть номер листинга или внутренний код.",
  "services.inspection.form.addressPlaceholder":
    "Полный адрес, название здания или pin-ориентир",
  "services.inspection.form.addressHelper":
    "Полный адрес идеален, но название здания или ближайший ориентир тоже подойдут.",
  "services.inspection.form.propertyUrlPlaceholder": "https://example.com/listing",
  "services.inspection.form.propertyUrlHelper":
    "Необязательно. Вставьте ссылку на листинг, если объект уже опубликован.",
  "services.inspection.form.buildingSnapshotTitle": "Снимок по зданию",
  "services.inspection.form.buildingSnapshotBody":
    "Поделитесь известными вам метражом или контекстом использования. Этот шаг необязателен.",
  "services.inspection.form.grossAreaPlaceholder": "m2",
  "services.inspection.form.netAreaPlaceholder": "m2",
  "services.inspection.form.buildingAgePlaceholder": "Лет",
  "services.inspection.form.floorNumberPlaceholder": "Текущий этаж",
  "services.inspection.form.totalFloorsPlaceholder": "Всего этажей в здании",
  "services.inspection.form.notesPlaceholder":
    "Добавьте всё, что поможет визиту пройти спокойно: видимые проблемы, условия доступа, желаемое время или особые замечания.",
  "services.inspection.form.notesHelper":
    "Необязательно. Укажите видимые проблемы, сроки принятия решения, заметки по доступу или всё, к чему инспектору стоит подготовиться.",
  "services.inspection.form.photosHelper":
    "Необязательно. Нескольких обзорных фото или скриншотов достаточно, если вы хотите быстрее показать видимые вопросы.",
  "services.inspection.form.noPhotosYet":
    "Фото пока не добавлены. Отправить запрос можно и без них.",
  "services.inspection.form.finalChecksBody":
    "Подтвердите, что мы можем связаться с вами по этому запросу. Маркетинговое согласие остаётся необязательным.",
  "services.inspection.form.successNext":
    "Мы рассматриваем запрос и связываемся с вами, чтобы подтвердить сроки, доступ и объём отчёта.",
  "services.inspection.form.keepChatOpen": "Хотите добавить что-нибудь ещё?",
  "services.inspection.form.successWhatsAppHint":
    "Можно продолжить в WhatsApp, если вы хотите отправить заметки по доступу, фото или обновления по срокам.",

  // inspection-landing
  "services.inspection.landing.heroEyebrow": "Due diligence с коммерческой ясностью",
  "services.inspection.landing.heroPoint1": "Структурированный выездной чек-лист",
  "services.inspection.landing.heroPoint2": "Взвешенный скоринг с риск-бандом",
  "services.inspection.landing.heroPoint3": "Практичный отчёт для цены и ремонта",
  "services.inspection.landing.decision1Title": "Для покупателей и инвесторов",
  "services.inspection.landing.decision1Body":
    "Поймите видимые проблемы состояния до того, как закрепите цену, capex или стратегию переговоров.",
  "services.inspection.landing.decision2Title": "Для собственников перед листингом",
  "services.inspection.landing.decision2Body":
    "Расставьте приоритеты по дефектам, которые с большей вероятностью замедляют просмотры, пересогласование цены и доверие покупателя.",
  "services.inspection.landing.decision3Title": "Для удалённого due diligence",
  "services.inspection.landing.decision3Body":
    "Получите структурированный взгляд на объект на месте, если вы не можете осмотреть его лично.",
  "services.inspection.landing.heroCardTitle": "На какие вопросы отвечает эта услуга",
  "services.inspection.landing.heroCardPoint1":
    "Сильнее или слабее видимое состояние, чем обещает ценовой нарратив?",
  "services.inspection.landing.heroCardPoint2":
    "Какие вопросы влияют на цену, переговоры или немедленный capex?",
  "services.inspection.landing.heroCardPoint3":
    "Какие части актива требуют профильной проверки до того, как вы продолжите?",
  "services.inspection.landing.heroTitleStrong":
    "Поймите, что вы покупаете, чините или выводите в листинг, до того как под риск попадут деньги и сроки",
  "services.inspection.landing.valueEyebrow": "Почему клиенты запрашивают эту услугу",
  "services.inspection.landing.valueHeading":
    "Отчёт, который поддерживает реальные решения, а не просто наблюдения",
  "services.inspection.landing.reviewHeading": "Что мы проверяем на месте",
  "services.inspection.landing.reviewSubtitle":
    "Инспекция построена вокруг тех частей актива, которые сильнее всего влияют на риск, цену, объём ремонта и уверенность в решении.",
  "services.inspection.landing.review1Title": "Конструкция и видимая целостность здания",
  "services.inspection.landing.review1Body":
    "Фундамент, трещины, стены, линии кровли, сигналы влажности и другие видимые индикаторы, влияющие на доверие к активу.",
  "services.inspection.landing.review2Title": "Коммуникации и инженерные системы",
  "services.inspection.landing.review2Body":
    "Сантехника, водоотвод, отопление, горячая вода и другие видимые элементы систем, которые могут тянуть за собой скрытые расходы.",
  "services.inspection.landing.review3Title": "Электрика и сигналы безопасности",
  "services.inspection.landing.review3Body":
    "Качество видимого монтажа, состояние щита, сигналы заземления и практические замечания по безопасности.",
  "services.inspection.landing.review4Title": "Комфорт и контекст соответствия",
  "services.inspection.landing.review4Body":
    "Окна, вентиляция, изоляция, признаки использования и видимые сигналы нормативного соответствия, влияющие на эксплуатацию и уверенность при перепродаже.",
  "services.inspection.landing.midCtaEyebrow": "Переходите к следующему шагу",
  "services.inspection.landing.midCtaTitle":
    "Если объект важен финансово, ясность должна появиться до обязательств",
  "services.inspection.landing.midCtaBody":
    "Поделитесь базой сейчас, и мы подтвердим объём, сроки и правильный формат инспекции.",
  "services.inspection.landing.scoreEyebrow": "Система скоринга",
  "services.inspection.landing.scorePoint1":
    "Каждый раздел оценивается отдельно, поэтому слабые места не теряются в общем описании.",
  "services.inspection.landing.scorePoint2":
    "Наибольший вес у конструкции, затем идут коммуникации, электрика, комфорт и соответствие.",
  "services.inspection.landing.scorePoint3":
    "Итоговый балл даёт быстрое чтение, а заметки и находки показывают, где действительно требуется внимание.",
  "services.inspection.landing.scorePoint4":
    "Риск-метки помогают нетехническим участникам быстро читать срочность.",
  "services.inspection.landing.riskHeading": "Как читать риск-бэнды",
  "services.inspection.landing.riskStrong": "Сильный",
  "services.inspection.landing.riskStrongBody":
    "В целом ровное видимое состояние и минимум срочных вопросов.",
  "services.inspection.landing.riskGood": "Хороший",
  "services.inspection.landing.riskGoodBody":
    "Сильная общая картина с управляемыми вопросами, которые стоит отметить.",
  "services.inspection.landing.riskAttention": "Требует внимания",
  "services.inspection.landing.riskAttentionBody":
    "Важные пункты требуют бюджета, переговоров или follow-up со специалистами.",
  "services.inspection.landing.riskHigh": "Высокий риск",
  "services.inspection.landing.riskHighBody":
    "Несколько видимых проблем или серьёзные риск-сигналы требуют осторожности до принятия решения.",
  "services.inspection.landing.previewEyebrow": "Тизер отчёта",
  "services.inspection.landing.previewHeading":
    "Что финальный отчёт помогает быстро увидеть",
  "services.inspection.landing.preview1Title": "Краткое резюме",
  "services.inspection.landing.preview1Body":
    "Быстрое чтение общего состояния, концентрации риска и тем, которые требуют follow-up.",
  "services.inspection.landing.preview2Title": "Скоринг по разделам",
  "services.inspection.landing.preview2Body":
    "Взвешенные оценки по разделам помогают сравнивать конструкцию, коммуникации, электрику и комфорт.",
  "services.inspection.landing.preview3Title": "Ключевые находки",
  "services.inspection.landing.preview3Body":
    "Понятные заметки по главным наблюдениям, уровню серьёзности и их коммерческому значению.",
  "services.inspection.landing.preview4Title": "Приоритеты ремонта и действий",
  "services.inspection.landing.preview4Body":
    "Практические следующие шаги для бюджета, переговоров, устранения проблем или профильной проверки.",
  "services.inspection.landing.previewScoreLabel": "Иллюстративный вид скоринга",
  "services.inspection.landing.previewMetricStructure": "Конструкция",
  "services.inspection.landing.previewMetricUtilities": "Коммуникации",
  "services.inspection.landing.previewMetricRisk": "Риск",
  "services.inspection.landing.previewRiskValue": "Требует внимания",
  "services.inspection.landing.processEyebrow": "Схема передачи",
  "services.inspection.landing.bottomCtaEyebrow": "Готовы начать",
  "services.inspection.landing.bottomCtaTitle":
    "Запросите инспекцию до того, как скрытые проблемы начнут принимать решение за вас",
  "services.inspection.landing.ctaSample": "Посмотреть пример отчёта",

  // staging-form
  "services.staging.form.eyebrow": "Начните с цели",
  "services.staging.form.introTitle":
    "Сначала расскажите, какого результата должен достичь объект, а уже потом перейдём к деталям.",
  "services.staging.form.introBody":
    "Первый шаг собирает контакты, бизнес-цель и общий объём. Детали объекта можно добавить дальше.",
  "services.staging.form.stepOneTitle": "Контакты и коммерческая цель",
  "services.staging.form.stepOneBody":
    "Поделитесь целью, желаемым бюджетом, сроками и услугами, которые вы уже понимаете, что нужны.",
  "services.staging.form.stepTwoTitle": "Детали объекта и финальная проверка",
  "services.staging.form.stepTwoBody":
    "Перед отправкой добавьте детали объекта, заметки, фото и финальные согласия.",
  "services.staging.form.contactTitle": "С кем связаться?",
  "services.staging.form.contactBody":
    "Укажите лучшие контакты для быстрого follow-up, уточнения бюджета и согласования.",
  "services.staging.form.fullNamePlaceholder": "Ваше полное имя",
  "services.staging.form.fullNameHelper":
    "Это имя мы будем использовать при подтверждении брифа по проекту.",
  "services.staging.form.phonePlaceholder": "+90 5XX XXX XXXX",
  "services.staging.form.phoneHelper":
    "Лучший номер для связи в тот же день, если бриф чувствителен ко времени.",
  "services.staging.form.emailPlaceholder": "name@example.com",
  "services.staging.form.emailHelper":
    "Полезно, если потребуется отправить письменное summary, пакетное предложение или follow-up.",
  "services.staging.form.whatsappHelper":
    "Необязательно. Удобно для быстрой координации, moodboard-ссылок и визуальных референсов.",
  "services.staging.form.intentTitle": "Замысел проекта",
  "services.staging.form.intentBody":
    "Начните с коммерческой цели и общего объёма. Так мы сможем вернуться с более полезной первой рекомендацией.",
  "services.staging.form.ownerTypeHelper":
    "Выберите роль, которая лучше всего отражает вашу вовлечённость в актив.",
  "services.staging.form.targetGoalHelper":
    "Необязательно, но полезно, если бриф связан с продажей, арендой или портфельным решением.",
  "services.staging.form.budgetHelper":
    "Необязательно. Грубый бюджет помогает предложить более реалистичный первый объём работ.",
  "services.staging.form.timelineHelper":
    "Необязательно. Полезно, если объект должен быть готов к рынку к определённой дате.",
  "services.staging.form.servicesHelper":
    "Выберите все услуги, которые вы уже ожидаете. Можно оставить список широким, если нужна рекомендация.",
  "services.staging.form.continueHint":
    "Дальше вы сможете добавить детали объекта, заметки, фото и финальное согласие.",
  "services.staging.form.propertyStepTitle": "Детали объекта и финальная проверка",
  "services.staging.form.propertyStepBody":
    "Добавьте известные вам данные по активу. Бриф можно отправить, даже если часть пунктов останется пустой.",
  "services.staging.form.propertyBasicsTitle": "Базовые данные по объекту",
  "services.staging.form.propertyBasicsBody":
    "Локация и характеристики актива помогают понять, какой объём работ реалистичен.",
  "services.staging.form.cityPlaceholder": "Город",
  "services.staging.form.districtPlaceholder": "Район или квартал",
  "services.staging.form.addressPlaceholder": "Полный адрес, название здания или ориентир",
  "services.staging.form.propertyTypePlaceholder": "Квартира, вилла, офис...",
  "services.staging.form.propertySizePlaceholder": "m2",
  "services.staging.form.propertySizeHelper":
    "Необязательно. Метраж помогает понять, насколько широким может быть объём стейджинга или реновации.",
  "services.staging.form.roomCountPlaceholder": "2+1, 3 bedrooms, studio...",
  "services.staging.form.propertyUrlPlaceholder": "https://example.com/listing",
  "services.staging.form.propertyUrlHelper":
    "Необязательно. Вставьте ссылку на листинг, если объект уже опубликован.",
  "services.staging.form.assetStateTitle": "Состояние актива и заметки",
  "services.staging.form.assetStateBody":
    "Этот блок помогает понять, идёт ли речь в первую очередь о styling, улучшениях или их сочетании.",
  "services.staging.form.notesPlaceholder":
    "Добавьте всё, что важно для брифа: существующие проблемы, целевой профиль покупателя или арендатора, дедлайн листинга или зоны, которым больше всего нужно улучшение.",
  "services.staging.form.notesHelper":
    "Необязательно. Здесь лучше всего указать профиль покупателя, дедлайн, слабые помещения и любые non-negotiables.",
  "services.staging.form.photosHelper":
    "Необязательно. Несколько текущих фото помогают нам понять, нужен ли сначала styling, лёгкая реновация, production-контент или их смесь.",
  "services.staging.form.noPhotosYet": "Фото пока не добавлены. Бриф можно отправить и без них.",
  "services.staging.form.finalChecksBody":
    "Подтвердите, что мы можем связаться с вами по этому брифу. Маркетинговое согласие остаётся необязательным.",
  "services.staging.form.successNext":
    "Сначала мы смотрим на цель, бюджет и сроки, а затем возвращаемся с самым подходящим следующим шагом.",
  "services.staging.form.keepChatOpen": "Хотите добавить ссылки или референсы?",
  "services.staging.form.successWhatsAppHint":
    "Можно продолжить в WhatsApp, если вы хотите отправить ссылки на листинг, визуальные референсы или обновлённые приоритеты.",

  // staging-landing
  "services.staging.landing.heroEyebrow": "Подача, которая помогает конверсии",
  "services.staging.landing.heroTitleStrong":
    "Превратите хороший объект в листинг, которому легче доверять, который проще смотреть и выбирать",
  "services.staging.landing.heroChip1": "Направление стейджинга",
  "services.staging.landing.heroChip2": "Объём лёгкой реновации",
  "services.staging.landing.heroChip3": "Премиальный фото- и видеоконтент",
  "services.staging.landing.heroCardTitle": "Что может покрывать эта услуга",
  "services.staging.landing.heroCardPoint1":
    "Комнаты, которые выглядят просторнее, чище и премиальнее на фото",
  "services.staging.landing.heroCardPoint2":
    "Точечные косметические улучшения там, где видимый ROI понятнее, чем у полной реновации",
  "services.staging.landing.heroCardPoint3":
    "Маркетинговые материалы, которые помогают международным и удалённым покупателям быстрее оценивать объект",
  "services.staging.landing.scopeEyebrow": "Объём услуги",
  "services.staging.landing.scopeTitle":
    "Более ясное разделение между стейджингом, косметическими работами и премиальным контентом",
  "services.staging.landing.benefit1Title": "Для собственников, которым нужен более сильный листинг",
  "services.staging.landing.benefit1Body":
    "Усильте визуальное доверие, уменьшите впечатление «объект требует работ» и сделайте подачу понятнее онлайн и на показах.",
  "services.staging.landing.benefit2Title": "Для инвесторов, сфокусированных на скорости и ценности",
  "services.staging.landing.benefit2Body":
    "Тратьте бюджет точечно на стейджинг, косметические улучшения и медиа там, где разрыв в подаче съедает отклики и ценовую силу.",
  "services.staging.landing.benefit3Title": "Для команд, которым нужен объём, а не догадки",
  "services.staging.landing.benefit3Body":
    "Мы помогаем отделить простые правки подачи от более тяжёлых работ, чтобы проект оставался коммерчески разумным.",
  "services.staging.landing.midCtaEyebrow": "До / после имеет значение",
  "services.staging.landing.midCtaTitle":
    "Если у актива уже есть потенциал спроса, подача часто становится самым быстрым рычагом",
  "services.staging.landing.midCtaBody":
    "Используйте витрину как ориентир по качеству, затем запросите объём, который соответствует вашей цели и бюджету.",
  "services.staging.landing.packagesSubtitle":
    "Опубликованные пакеты показывают, как можно собрать объём, сроки и deliverables. Финальный объём подтверждается после разбора объекта.",
  "services.staging.landing.packagesLink": "Запросить индивидуальный объём",
  "services.staging.landing.packagesFallbackTitle":
    "Когда объём ещё открыт, пакеты настраиваются под проект",
  "services.staging.landing.processEyebrow": "Процесс",
  "services.staging.landing.processTitle":
    "Как формируется объём стейджинга и реновации",
  "services.staging.landing.step1Title": "Бриф и обзор объекта",
  "services.staging.landing.step1Body":
    "Мы смотрим на цель, состояние актива, фото и сроки, чтобы определить правильный уровень вмешательства.",
  "services.staging.landing.step2Title": "Рекомендация по объёму и пакету",
  "services.staging.landing.step2Body":
    "Вы получаете более ясный план по стейджингу, лёгкой реновации, производству контента или комбинированному подходу.",
  "services.staging.landing.step3Title": "Реализация и передача контента",
  "services.staging.landing.step3Body":
    "Объект подготавливается, снимается и выводится на рынок с более сильной визуальной уверенностью для продажи или аренды.",
  "services.staging.landing.packageCategories.visual-refresh.label": "Визуальное обновление",
  "services.staging.landing.packageCategories.visual-refresh.summary":
    "Более лёгкий объём, сфокусированный на качестве подачи, чистоте визуалов и быстрой готовности к листингу.",
  "services.staging.landing.packageCategories.sale-ready.label": "Готово к продаже",
  "services.staging.landing.packageCategories.sale-ready.summary":
    "Более широкий пакет, который объединяет выборочную реновацию, стейджинг и медиа для усиления ценовой позиции.",
  "services.staging.landing.packageCategories.premium-boost.label": "Премиум-усиление",
  "services.staging.landing.packageCategories.premium-boost.summary":
    "Премиальный запуск для активов, где отделка, контент и видимость должны усиливать друг друга вместе.",
  "services.staging.landing.packageCategories.custom.label": "Индивидуальный объём",
  "services.staging.landing.packageCategories.custom.summary":
    "Индивидуальный объём, собранный вокруг актива, сроков и коммерческой цели.",
  "services.staging.landing.packageCategories.default.summary":
    "Объём адаптируется под актив, цель по видимости и сроки выхода.",
  "services.staging.landing.packageOrderLabel": "Пакет",
  "services.staging.landing.packageDaysSuffix": "дней",
  "services.staging.landing.packageMetaBudget": "Ориентир по бюджету",
  "services.staging.landing.packageMetaCustom": "Индивидуально",
  "services.staging.landing.packageMetaTimeline": "Оценочный срок",
  "services.staging.landing.packageMetaFlexible": "Зависит от объёма",
  "services.staging.landing.packageMetaIncluded": "Что включено",
  "services.staging.landing.packageServicesSuffix": "пунктов",
  "services.staging.landing.packageFitTitle": "Когда подходит этот пакет",
  "services.staging.landing.packageCta": "Обсудить этот пакет",
  "services.staging.landing.budgetPoint1":
    "Небольшие объёмы обычно сосредоточены на styling, расхламлении и медиапроизводстве.",
  "services.staging.landing.budgetPoint2":
    "Средние объёмы часто совмещают работу над подачей с выборочными косметическими улучшениями.",
  "services.staging.landing.budgetPoint3":
    "Крупные объёмы лучше оставлять для видимых улучшений, которые действительно меняют восприятие актива.",
  "services.staging.landing.timelineCard1Label": "Типичный быстрый объём",
  "services.staging.landing.timelineCard1Value": "От нескольких дней до пары недель",
  "services.staging.landing.timelineCard2Label": "Более широкий объём",
  "services.staging.landing.timelineCard2Value": "Многоэтапное планирование и реализация",
  "services.staging.landing.ctaProjects": "Смотреть трансформации",
  "services.staging.landing.bottomCtaEyebrow": "Готовы описать проект",
  "services.staging.landing.bottomCtaTitle":
    "Начните с актива, цели и сроков. Остальное мы сформируем вместе с вами.",

  // staging-projects
  "services.staging.projectsPage.eyebrow": "Опубликованные трансформации",
  "services.staging.projectsPage.countLabel": "Опубликованные кейсы",
  "services.staging.projectsPage.ctaRequest": "Запросить консультацию",
  "services.staging.projectsPage.emptyTitle":
    "Опубликованные staging-проекты появятся здесь сразу после публикации",
  "services.staging.projectsPage.emptyBody":
    "Эта витрина использует только опубликованные проекты из admin-системы. Если пока ничего не опубликовано, вы всё равно можете оставить заявку на консультацию, и мы предложим подходящий объём.",
  "services.staging.projectsPage.previewLabel": "Опубликованный проект",
  "services.staging.projectsPage.metaFallback": "По запросу",
  "services.staging.projectsPage.timelineFallback": "Зависит от объёма",
  "services.staging.projectsPage.budgetFallback": "Подбирается под проект",
  "services.staging.projectsPage.beforeAfterReady": "Медиа до / после опубликованы",

  // staging-project-detail
  "services.staging.projectDetail.beforeAlt": "{{title}} до",
  "services.staging.projectDetail.afterAlt": "{{title}} после",
  "services.staging.projectDetail.notFoundBody":
    "Возможно, этот проект снят с публикации, переименован или недоступен для публичного просмотра.",
  "services.staging.projectDetail.ctaConsultation": "Запросить консультацию",
  "services.staging.projectDetail.beforeAfterEyebrow": "Сравнение до / после",
  "services.staging.projectDetail.beforeAfterTitle": "Основной вид трансформации",
  "services.staging.projectDetail.mediaPendingTitle": "Медиа до / после появятся здесь",
  "services.staging.projectDetail.mediaPendingBody":
    "Проект опубликован, но публичные материалы для сравнения пока не добавлены.",
  "services.staging.projectDetail.galleryTitle": "Дополнительные виды до / после",
  "services.staging.projectDetail.galleryBody":
    "Дополнительные виды помогают показать, как объём работ распространился на разные зоны объекта.",
  "services.staging.projectDetail.testimonialEyebrow": "Взгляд клиента",
  "services.staging.projectDetail.testimonialTitle": "Отзыв",
  "services.staging.projectDetail.mediaLinksTitle": "Опубликованные медиа-ссылки",
  "services.staging.projectDetail.mediaLink.virtualTour": "Виртуальный тур",
  "services.staging.projectDetail.mediaLink.droneFootage": "Съёмка с дрона",
  "services.staging.projectDetail.mediaLink.floorPlan": "Планировка",
  "services.staging.projectDetail.openLink": "Открыть медиа",
  "services.staging.projectDetail.packageEyebrow": "Контекст пакета",
  "services.staging.projectDetail.packageTitle": "Выбранный пакет",
  "services.staging.projectDetail.metricsTitle": "Опубликованные сигналы результата",
  "services.staging.projectDetail.consultationEyebrow": "Обсудить похожий объём",
  "services.staging.projectDetail.consultationTitle":
    "Кратко опишите объект, и мы предложим подходящий уровень стейджинга или реновации.",
  "services.staging.projectDetail.consultationBody":
    "Поделитесь активом, сроками и целевым результатом. Публичная витрина реальна, но итоговый объём всё равно подбирается под конкретный объект.",
  "services.staging.projectDetail.minimalState":
    "Сейчас у этого опубликованного проекта ограниченный набор публичных полей. Когда в админке добавят больше медиа и narrative, страница автоматически станет богаче.",

  // staging-enums
  "services.enums.staging.service.decluttering": "Расхламление",
  "services.enums.staging.service.deep_cleaning": "Глубокая уборка",
  "services.enums.staging.service.minor_repairs": "Небольшой ремонт",
  "services.enums.staging.service.painting": "Покраска",
  "services.enums.staging.service.furniture_rental": "Аренда мебели",
  "services.enums.staging.service.accessory_styling": "Декор и аксессуары",
  "services.enums.staging.service.professional_photography": "Профессиональная фотосъёмка",
  "services.enums.staging.service.videography": "Видеосъёмка",
  "services.enums.staging.service.drone_footage": "Съёмка с дрона",
  "services.enums.staging.service.virtual_tour_360": "360° тур",
  "services.enums.staging.service.floor_plan_2d": "2D-планировка",
  "services.enums.staging.service.floor_plan_3d": "3D-планировка",
  "services.enums.staging.service.social_media_content": "Контент для соцсетей",
  "services.enums.staging.service.listing_copywriting": "Текст для объявления",
  "services.enums.staging.service.home_staging_full": "Полный стейджинг",
  "services.enums.staging.service.renovation_light": "Лёгкая реновация",
  "services.enums.staging.service.renovation_full": "Полная реновация",
  "services.privatePanel.eyebrow": "Панель заявок",
  "services.privatePanel.title": "Мои сервисные заявки",
  "services.privatePanel.subtitle":
    "Смотрите заявки на стейджинг, реновацию и инспекцию в одном месте.",
  "services.privatePanel.refresh": "Обновить",
  "services.privatePanel.loadError": "Не удалось загрузить ваши заявки.",
  "services.privatePanel.emptyTitle": "Заявок пока нет",
  "services.privatePanel.emptyBody":
    "Ваши заявки на стейджинг, реновацию и инспекцию появятся здесь после отправки.",
  "services.privatePanel.ctaStaging": "Отправить заявку на стейджинг",
  "services.privatePanel.ctaInspection": "Отправить заявку на инспекцию",
  "services.privatePanel.stagingSectionTitle": "Стейджинг и реновация",
  "services.privatePanel.stagingSectionBody":
    "Обновления по подаче, реновации и проекту от компании.",
  "services.privatePanel.inspectionSectionTitle": "Заявки на инспекцию",
  "services.privatePanel.inspectionSectionBody":
    "Статус заявки на инспекцию, баллы и обновления по отчету.",
  "services.privatePanel.stagingLabel": "Стейджинг / реновация",
  "services.privatePanel.stagingFallbackTitle": "Заявка на стейджинг / реновацию",
  "services.privatePanel.inspectionLabel": "Инспекция",
  "services.privatePanel.inspectionFallbackTitle": "Заявка на инспекцию объекта",
  "services.privatePanel.submittedOn": "Отправлено",
  "services.privatePanel.projectLabel": "Проект",
  "services.privatePanel.reportLabel": "Отчет",
  "services.privatePanel.requestSummary": "Ваша заявка",
  "services.privatePanel.goal": "Цель",
  "services.privatePanel.requestBudget": "Бюджет",
  "services.privatePanel.requestTimeline": "Срок",
  "services.privatePanel.property": "Объект",
  "services.privatePanel.requestedServices": "Запрошенные услуги",
  "services.privatePanel.yourNotes": "Ваши заметки",
  "services.privatePanel.companyUpdate": "Обновление от компании",
  "services.privatePanel.visitChecklist": "Чеклист визита",
  "services.privatePanel.visitScheduled": "Визит на объект запланирован",
  "services.privatePanel.visitScheduledBody":
    "Компания поделилась временем визита на объект. Проверьте расписание и заметку ниже.",
  "services.privatePanel.visitDateTime": "Время визита",
  "services.privatePanel.visitLocation": "Локация",
  "services.privatePanel.visitNote": "Заметка к чеклисту",
  "services.privatePanel.companyBudget": "Оценка компании",
  "services.privatePanel.companyTimeline": "Рабочий график",
  "services.privatePanel.scope": "Текущий объем",
  "services.privatePanel.metricValueUplift": "Рост стоимости",
  "services.privatePanel.metricRentalUplift": "Рост аренды",
  "services.privatePanel.metricSaleSpeed": "Скорость продажи",
  "services.privatePanel.metricSaleSpeedValue": "на {{days}} дн. быстрее",
  "services.privatePanel.viewPublicShowcase": "Открыть публичный кейс",
  "services.privatePanel.privateOnly": "Видно только в вашем приватном аккаунте до публикации.",
  "services.privatePanel.pendingCompanyUpdate":
    "Компания пока не добавила формальное обновление по проекту.",
  "services.privatePanel.requestType": "Тип заявки",
  "services.privatePanel.urgency": "Срочность",
  "services.privatePanel.requester": "Заявитель",
  "services.privatePanel.referenceCode": "Референс",
  "services.privatePanel.scheduleLabel": "График",
  "services.privatePanel.inspectionScore": "Оценка инспекции",
  "services.privatePanel.riskLabel": "Уровень риска",
  "services.privatePanel.reportStatus": "Статус отчета",
  "services.privatePanel.updatedLabel": "Последнее обновление",
  "services.privatePanel.sectionScores": "Баллы по разделам",
  "services.privatePanel.propertyOutcome": "Что произойдет с вашим объектом",
  "services.privatePanel.recommendation": "Рекомендация",
  "services.privatePanel.beforePhotos": "До",
  "services.privatePanel.afterPhotos": "После",
  "services.privatePanel.beforePhotoAlt": "Предпросмотр объекта до {{index}}",
  "services.privatePanel.afterPhotoAlt": "Предпросмотр объекта после {{index}}",
  "services.privatePanel.noBeforePreview": "Превью до пока не загружено",
  "services.privatePanel.noAfterPreview": "Превью после пока не загружено",
  "services.privatePanel.keyFindings": "Ключевые выводы",
  "services.privatePanel.repairEstimates": "Оценка ремонта",
  "services.privatePanel.openReportFile": "Открыть файл отчета",
  "services.privatePanel.pendingInspectionUpdate":
    "Компания пока не добавила checklist или обновление отчета.",
  "services.privatePanel.inspectionSections.structuralSafety": "Конструктивная безопасность",
  "services.privatePanel.inspectionSections.legalCompliance": "Юридическое соответствие",
  "services.privatePanel.inspectionSections.utilitiesPlumbing": "Коммуникации и сантехника",
  "services.privatePanel.inspectionSections.electricalSafety": "Электробезопасность",
  "services.privatePanel.inspectionSections.comfortInsulation": "Комфорт и изоляция",
  "services.privatePanel.scoreTone.strong": "Отличное состояние",
  "services.privatePanel.scoreTone.good": "Хорошее состояние",
  "services.privatePanel.scoreTone.needs_attention": "Нужно внимание",
  "services.privatePanel.scoreTone.high_risk": "Высокий риск",
  "services.privatePanel.scoreTone.pending": "В ожидании",
  "services.privatePanel.riskValue.strong": "Низкий риск",
  "services.privatePanel.riskValue.good": "Умеренный риск",
  "services.privatePanel.riskValue.needs_attention": "Требует внимания",
  "services.privatePanel.riskValue.high_risk": "Высокий риск",
  "services.privatePanel.riskValue.medium_risk": "Средний риск",
  "services.privatePanel.riskValue.low_risk": "Низкий риск",
  "services.privatePanel.riskValue.pending": "В ожидании",
  "services.privatePanel.reportStatusValue.draft": "Черновик",
  "services.privatePanel.reportStatusValue.review": "На проверке",
  "services.privatePanel.reportStatusValue.final": "Финальный",
  "services.privatePanel.reportStatusValue.delivered": "Доставлен",
  "services.privatePanel.findingSeverity.low": "Низкий",
  "services.privatePanel.findingSeverity.medium": "Средний",
  "services.privatePanel.findingSeverity.high": "Высокий",
  "services.privatePanel.findingSeverity.critical": "Критический",
  "services.privatePanel.findingSeverity.none": "Нет",
  "services.privatePanel.findingStatus.good": "Хорошо",
  "services.privatePanel.findingStatus.acceptable": "Допустимо",
  "services.privatePanel.findingStatus.risky": "Рискованно",
  "services.privatePanel.findingStatus.critical": "Критично",
  "services.privatePanel.findingStatus.not_checked": "Не проверено",
  "services.privatePanel.status.new": "Новая",
  "services.privatePanel.status.qualified": "Квалифицирована",
  "services.privatePanel.status.proposal_sent": "Предложение отправлено",
  "services.privatePanel.status.approved": "Одобрено",
  "services.privatePanel.status.planning": "Планирование",
  "services.privatePanel.status.in_progress": "В работе",
  "services.privatePanel.status.content_pending": "Ожидается контент",
  "services.privatePanel.status.completed": "Завершено",
  "services.privatePanel.status.published": "Опубликовано",
  "services.privatePanel.status.closed": "Закрыто",
  "services.privatePanel.status.cancelled": "Отменено",
  "services.privatePanel.status.contacted": "Связались",
  "services.privatePanel.status.scheduled": "Запланировано",
  "services.privatePanel.status.in_review": "На проверке",
  "services.privatePanel.status.inspection_completed": "Инспекция завершена",
  "services.privatePanel.status.report_drafting": "Подготовка отчета",
  "services.privatePanel.status.report_ready": "Отчет готов",
  "services.privatePanel.status.delivered": "Доставлено",
  "services.privatePanel.status.on_hold": "На паузе",
};

const servicesLocaleOverrides = {
  en: expandFlatMap(enFlatMap),
  tr: expandFlatMap(trFlatMap),
  ru: expandFlatMap(ruFlatMap),
};

export default servicesLocaleOverrides;
