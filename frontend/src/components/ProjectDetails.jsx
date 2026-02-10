import { useState, useRef, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Group,
  NumberInput,
  TextInput,
  Select,
  Textarea,
  Text,
  Grid,
  Avatar,
  Paper,
  Divider,
  ActionIcon,
  Checkbox,
  Tabs,
  Image,
  ScrollArea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import PropTypes from "prop-types";
import {
  MdDelete,
  MdAdd,
  MdOutlineCloudUpload,
  MdClose,
  MdInfo,
  MdMap,
  MdLocationOn,
  MdPerson,
} from "react-icons/md";
import { BsBuilding, BsGrid, BsShield, BsTree, BsEye, BsPeople } from "react-icons/bs";
import { FaWheelchair, FaShoppingCart } from "react-icons/fa";
import useConsultants from "../hooks/useConsultants";
import CurrencyContext from "../context/CurrencyContext";

// Feature categories for projects
const BINA_OZELLIKLERI = [
  "Akıllı Ev",
  "Alarm (Yangın)",
  "Buzdolabı",
  "Fiber İnternet",
  "Intercom Sistemi",
  "Kablo TV",
  "Uydu",
  "Jeneratör",
  "Isı Yalıtımı",
  "Ses Yalıtımı",
  "Su Deposu",
];

const DIS_OZELLIKLER = [
  "Bahçe / Garden",
  "Buhar Odası / Steam Room",
  "Garaj / Garage",
  "2 Katlı Garaj / 2 Floors Garage",
  "Isı Yalıtımı / Heat Insulation",
  "Otopark / Parking",
  "Havuz / Pool",
  "Gym",
  "Çocuk Parkı / Children's Playground",
  "Spor Alanı / Sports Area",
  "Basketbol Sahası / Basketball Court",
  "Futbol Sahası / Football Court",
  "Tenis Kortu / Tennis Court",
  "Yürüyüş Yolu / Walking Path",
  "Bisiklet Yolu / Bicycle Path",
  "Peyzaj / Landscaping",
  "Kapıcı Dairesi / Doorman's Apartment",
  "Kreş / Nursery",
  "Siding",
  "Uydu / Satellite",
];

const ENGELLI_YASLI_UYGUN = [
  "Engelli Asansörü",
  "Engelli Rampası",
  "Engelli WC",
  "Yaşlı Dostu Tasarım",
  "Görme Engelli Yardımcıları",
];

const EGLENCE_ALISVERIS = [
  "AVM / Shopping Mall",
  "Restoran / Restaurant",
  "Cafe",
  "Sinema / Cinema",
  "Fitness Salonu / Gym",
  "SPA",
  "Sauna",
  "Türk Hamamı / Turkish Bath",
  "Çocuk Kulübü / Kids Club",
  "Hobi Odası / Hobby Room",
];

const GUVENLIK = [
  "24 Saat Güvenlik",
  "Güvenlik Kamerası",
  "Kapalı Devre TV",
  "Kartlı Giriş Sistemi",
  "Site İçi Güvenlik",
  "Yangın Merdiveni",
  "Yangın Söndürme Sistemi",
];

const MANZARA = [
  "Şehir Manzarası",
  "Deniz Manzarası",
  "Doğa Manzarası",
  "Göl Manzarası",
  "Orman Manzarası",
  "Dağ Manzarası",
  "Havuz Manzarası",
  "Bahçe Manzarası",
];

const MUHIT = [
  "Metro",
  "Metrobüs",
  "Otobüs Durağı",
  "Okul",
  "Hastane",
  "Market",
  "Eczane",
  "Banka",
  "Park",
  "Cami",
  "Üniversite",
  "Alışveriş Merkezi",
  "Cemevi",
  "Fuar",
  "İlkokul-Ortaokul",
  "Sağlık Ocağı",
];

const FIAT_CURRENCIES = ["USD", "EUR", "TRY"];
const FLOOR_PLAN_PRICE_FIELDS = {
  USD: "fiyatUSD",
  EUR: "fiyatEUR",
  TRY: "fiyatTRY",
};

const normalizeFiatCurrency = (currencyCode) => {
  const defaultFromEnv = String(
    import.meta.env.VITE_DEFAULT_FIAT_CURRENCY || "USD"
  ).toUpperCase();
  const fallback = FIAT_CURRENCIES.includes(defaultFromEnv)
    ? defaultFromEnv
    : "USD";
  const normalized = String(currencyCode || "").toUpperCase();
  return FIAT_CURRENCIES.includes(normalized) ? normalized : fallback;
};

const hasOwnField = (obj, field) =>
  Object.prototype.hasOwnProperty.call(obj || {}, field);

const toRoundedPrice = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  return Math.round(numericValue);
};

const ProjectDetails = ({
  prevStep,
  nextStep,
  propertyDetails,
  setPropertyDetails,
}) => {
  const cloudinaryRef = useRef();
  const sitePlanWidgetRef = useRef();
  const mapImageWidgetRef = useRef();
  const [imageUploading, setImageUploading] = useState(false);
  const [mapImageUploading, setMapImageUploading] = useState(false);
  const [floorPlanUploading, setFloorPlanUploading] = useState(null); // Index of floor plan being uploaded
  const { data: consultants, isLoading: consultantsLoading } = useConsultants();
  const { convertAmount } = useContext(CurrencyContext);
  const floorPlanBaseCurrency = normalizeFiatCurrency(propertyDetails.currency);

  const form = useForm({
    initialValues: {
      // Proje Adı
      projectName: propertyDetails.projectName || "",
      // İlan Numarası
      ilanNo: propertyDetails.ilanNo || "",
      // Danışman
      consultantId: propertyDetails.consultantId || "",
      // Proje Hakkında
      projeAlani: propertyDetails.projeHakkinda?.projeAlani || 0,
      yesilAlan: propertyDetails.projeHakkinda?.yesilAlan || 0,
      konutSayisi: propertyDetails.projeHakkinda?.konutSayisi || 0,
      projeAciklama_tr: propertyDetails.projeHakkinda?.description_tr || propertyDetails.projeHakkinda?.description || "",
      projeAciklama_en: propertyDetails.projeHakkinda?.description_en || "",
      projeAciklama_ru: propertyDetails.projeHakkinda?.description_ru || "",
      // Kampanya
      kampanya: propertyDetails.kampanya || "",
      // Teslim Tarihi ve Proje Durumu
      deliveryDate: propertyDetails.deliveryDate || "",
      projectStatus: propertyDetails.projectStatus || "devam-ediyor",
      // Facilities
      bedrooms: propertyDetails.facilities?.bedrooms || 0,
      bathrooms: propertyDetails.facilities?.bathrooms || 0,
      parkings: propertyDetails.facilities?.parkings || 0,
      // Yakın Mesafeler
      yakinMesafeler: propertyDetails.projeHakkinda?.yakinMesafeler || [],
      // Daire Planları
      dairePlanlari: (propertyDetails.dairePlanlari || []).map((plan) => ({
        ...plan,
        currency: normalizeFiatCurrency(
          plan?.currency || propertyDetails.currency
        ),
      })),
      // Vaziyet Planı
      vaziyetPlani: propertyDetails.vaziyetPlani || "",
      // Harita Görseli
      mapImage: propertyDetails.mapImage || "",
      // Özellikler
      binaOzellikleri: propertyDetails.ozellikler?.binaOzellikleri || [],
      disOzellikler: propertyDetails.ozellikler?.disOzellikler || [],
      engelliYasliUygun: propertyDetails.ozellikler?.engelliYasliUygun || [],
      eglenceAlisveris: propertyDetails.ozellikler?.eglenceAlisveris || [],
      guvenlik: propertyDetails.ozellikler?.guvenlik || [],
      manzara: propertyDetails.ozellikler?.manzara || [],
      muhit: propertyDetails.ozellikler?.muhit || [],
    },
  });

  const getFloorPlanPriceByCurrency = (plan, targetCurrency) => {
    const fieldKey = FLOOR_PLAN_PRICE_FIELDS[targetCurrency];
    if (hasOwnField(plan, fieldKey)) {
      return toRoundedPrice(plan[fieldKey]);
    }

    const legacyPrice = toRoundedPrice(plan?.fiyat);
    if (!legacyPrice) return 0;

    const sourceCurrency = normalizeFiatCurrency(
      plan?.currency || floorPlanBaseCurrency
    );
    return toRoundedPrice(
      convertAmount(legacyPrice, sourceCurrency, targetCurrency)
    );
  };

  const updateFloorPlanPrices = (index, sourceCurrency, value) => {
    const plans = [...form.values.dairePlanlari];
    const currentPlan = { ...(plans[index] || {}) };
    const sourceValue = toRoundedPrice(value);

    FIAT_CURRENCIES.forEach((currencyCode) => {
      const fieldKey = FLOOR_PLAN_PRICE_FIELDS[currencyCode];
      const convertedValue =
        currencyCode === sourceCurrency
          ? sourceValue
          : convertAmount(sourceValue, sourceCurrency, currencyCode);
      currentPlan[fieldKey] = toRoundedPrice(convertedValue);
    });

    const baseFieldKey = FLOOR_PLAN_PRICE_FIELDS[floorPlanBaseCurrency];
    currentPlan.fiyat = toRoundedPrice(currentPlan[baseFieldKey]);
    currentPlan.currency = floorPlanBaseCurrency;
    plans[index] = currentPlan;
    form.setFieldValue("dairePlanlari", plans);
  };

  // Initialize Cloudinary widgets for site plan and map image
  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;

    // Site plan image widget
    sitePlanWidgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        resourceType: "image",
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          form.setFieldValue("vaziyetPlani", result.info.secure_url);
        }
        if (result.event === "close") {
          setImageUploading(false);
        }
      }
    );

    // Map image widget
    mapImageWidgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        resourceType: "image",
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          form.setFieldValue("mapImage", result.info.secure_url);
        }
        if (result.event === "close") {
          setMapImageUploading(false);
        }
      }
    );
  }, []);

  const openSitePlanUpload = () => {
    setImageUploading(true);
    sitePlanWidgetRef.current?.open();
  };

  const openMapImageUpload = () => {
    setMapImageUploading(true);
    mapImageWidgetRef.current?.open();
  };

  // Open Cloudinary widget for floor plan image
  const openFloorPlanUpload = (index) => {
    setFloorPlanUploading(index);
    const floorPlanWidget = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        resourceType: "image",
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          const plans = [...form.values.dairePlanlari];
          plans[index].image = result.info.secure_url;
          form.setFieldValue("dairePlanlari", plans);
        }
        if (result.event === "close") {
          setFloorPlanUploading(null);
        }
      }
    );
    floorPlanWidget?.open();
  };

  const addFloorPlan = () => {
    const newPlan = {
      id: Date.now(),
      tip: "",
      varyant: "",
      fiyat: 0,
      fiyatUSD: 0,
      fiyatEUR: 0,
      fiyatTRY: 0,
      currency: floorPlanBaseCurrency,
      metrekare: 0,
      image: "",
    };
    form.setFieldValue("dairePlanlari", [...form.values.dairePlanlari, newPlan]);
  };

  const addYakinMesafe = () => {
    form.setFieldValue("yakinMesafeler", [...form.values.yakinMesafeler, { yer: "", mesafe: "" }]);
  };

  const removeYakinMesafe = (index) => {
    const mesafeler = form.values.yakinMesafeler.filter((_, i) => i !== index);
    form.setFieldValue("yakinMesafeler", mesafeler);
  };

  const removeFloorPlan = (index) => {
    const plans = form.values.dairePlanlari.filter((_, i) => i !== index);
    form.setFieldValue("dairePlanlari", plans);
  };

  const handleSubmit = () => {
    setPropertyDetails((prev) => ({
      ...prev,
      projectName: form.values.projectName,
      ilanNo: form.values.ilanNo,
      consultantId: form.values.consultantId || null,
      projeHakkinda: {
        projeAlani: form.values.projeAlani,
        yesilAlan: form.values.yesilAlan,
        konutSayisi: form.values.konutSayisi,
        description:
          form.values.projeAciklama_tr ||
          form.values.projeAciklama_en ||
          form.values.projeAciklama_ru ||
          "",
        description_tr: form.values.projeAciklama_tr,
        description_en: form.values.projeAciklama_en,
        description_ru: form.values.projeAciklama_ru,
        yakinMesafeler: form.values.yakinMesafeler.filter((m) => m.yer.trim() !== ""),
      },
      kampanya: form.values.kampanya,
      deliveryDate: form.values.deliveryDate,
      projectStatus: form.values.projectStatus,
      facilities: {
        bedrooms: form.values.bedrooms || 0,
        bathrooms: form.values.bathrooms || 0,
        parkings: form.values.parkings || 0,
      },
      dairePlanlari: form.values.dairePlanlari,
      vaziyetPlani: form.values.vaziyetPlani,
      mapImage: form.values.mapImage,
      ozellikler: {
        binaOzellikleri: form.values.binaOzellikleri,
        disOzellikler: form.values.disOzellikler,
        engelliYasliUygun: form.values.engelliYasliUygun,
        eglenceAlisveris: form.values.eglenceAlisveris,
        guvenlik: form.values.guvenlik,
        manzara: form.values.manzara,
        muhit: form.values.muhit,
      },
    }));
    nextStep();
  };

  const consultantOptions =
    consultants?.map((c) => ({
      value: c.id,
      label: c.name,
      image: c.image,
      title: c.title,
    })) || [];

  return (
    <Box maw={"95%"} mx="auto" my={"md"}>
      <ScrollArea h="65vh" offsetScrollbars>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
{/* İLAN NUMARASI (Listing Number) */}
          <Paper p="lg" withBorder mb="lg" className="bg-orange-50">
            <div className="flex items-center gap-2 mb-4">
              <Text fw={700} size="lg" c="orange"># İlan Numarası</Text>
            </div>
            <Select
              label="Danışman Ata"
              placeholder="Bu proje için bir danışman seçin"
              description="Danışman, bu proje için iletişim kişisi olarak gösterilecektir"
              data={consultantOptions}
              value={form.values.consultantId}
              onChange={(value) => form.setFieldValue("consultantId", value)}
              clearable
              searchable
              disabled={consultantsLoading}
              mt="md"
              leftSection={<MdPerson size={16} />}
              renderOption={({ option }) => (
                <div className="flex items-center gap-2 py-1">
                  <Avatar src={option.image} size="sm" radius="xl" />
                  <div>
                    <Text size="sm" fw={500}>
                      {option.label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {option.title}
                    </Text>
                  </div>
                </div>
              )}
            />
            <TextInput
              label="İlan No"
              placeholder="#1201651741"
              description="Proje ilan numarasını girin (örn: #1201651741)"
              {...form.getInputProps("ilanNo")}
            />
          </Paper>

          {/* PROJE HAKKINDA (About Project) */}
          <Paper p="lg" withBorder mb="lg" className="bg-blue-50">
            <div className="flex items-center gap-2 mb-4">
              <MdInfo size={24} className="text-blue-600" />
              <Text fw={700} size="lg" c="blue">Proje Hakkında</Text>
            </div>

            <Grid>
              <Grid.Col span={4}>
                <NumberInput
                  label="Proje Alanı (m²)"
                  placeholder="20500"
                  min={0}
                  thousandSeparator="."
                  decimalSeparator=","
                  {...form.getInputProps("projeAlani")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Yeşil Alan (m²)"
                  placeholder="7500"
                  min={0}
                  thousandSeparator="."
                  decimalSeparator=","
                  {...form.getInputProps("yesilAlan")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Konut Sayısı"
                  placeholder="884"
                  min={0}
                  {...form.getInputProps("konutSayisi")}
                />
              </Grid.Col>
            </Grid>

            {/* Proje Açıklaması - İki Dil */}
            <Grid mt="md">
              <Grid.Col span={4}>
                <Textarea
                  label="Proje Açıklaması (Türkçe)"
                  placeholder="Şehrin merkezinde, bahçeli bir yaşam!&#10;&#10;Şehrin tam kalbinde, keyifli bir yaşam sizi bekliyor..."
                  minRows={6}
                  {...form.getInputProps("projeAciklama_tr")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Textarea
                  label="Project Description (English)"
                  placeholder="A garden life in the city center!&#10;&#10;An enjoyable life awaits you in the heart of the city..."
                  minRows={6}
                  {...form.getInputProps("projeAciklama_en")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Textarea
                  label="Project Description (Russian)"
                  placeholder="Description in Russian..."
                  minRows={6}
                  {...form.getInputProps("projeAciklama_ru")}
                />
              </Grid.Col>
            </Grid>

            {/* Kampanya */}
            <TextInput
              label="Kampanya Metni"
              placeholder="2+1 DAİRELER %50 PESİN %50 36 AY VADE FARKSIZ TAKSİT İMKANI"
              mt="md"
              {...form.getInputProps("kampanya")}
            />

            {/* Teslim Tarihi ve Proje Durumu */}
            <Grid mt="md">
              <Grid.Col span={6}>
                <TextInput
                  label="Teslim Tarihi"
                  placeholder="Mayıs 2027"
                  {...form.getInputProps("deliveryDate")}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Proje Durumu"
                  placeholder="devam-ediyor veya tamamlandi"
                  {...form.getInputProps("projectStatus")}
                />
              </Grid.Col>
            </Grid>

            {/* Yakın Mesafeler */}
            <Divider my="md" label="Yakın Mesafeler" labelPosition="center" />
            <div className="space-y-2">
              {form.values.yakinMesafeler.map((mesafe, index) => (
                <Group key={index}>
                  <TextInput
                    placeholder="Yer adı (örn: D-100)"
                    value={mesafe.yer}
                    onChange={(e) => {
                      const mesafeler = [...form.values.yakinMesafeler];
                      mesafeler[index].yer = e.target.value;
                      form.setFieldValue("yakinMesafeler", mesafeler);
                    }}
                    style={{ flex: 2 }}
                  />
                  <TextInput
                    placeholder="Mesafe (örn: 1 km)"
                    value={mesafe.mesafe}
                    onChange={(e) => {
                      const mesafeler = [...form.values.yakinMesafeler];
                      mesafeler[index].mesafe = e.target.value;
                      form.setFieldValue("yakinMesafeler", mesafeler);
                    }}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => removeYakinMesafe(index)}
                  >
                    <MdDelete size={18} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="subtle"
                color="blue"
                size="xs"
                leftSection={<MdAdd size={14} />}
                onClick={addYakinMesafe}
              >
                Mesafe Ekle
              </Button>
            </div>
          </Paper>

          {/* OLANAKLAR (Facilities) */}
          <Paper p="lg" withBorder mb="lg" className="bg-teal-50">
            <div className="flex items-center gap-2 mb-4">
              <BsBuilding size={24} className="text-teal-600" />
              <Text fw={700} size="lg" c="teal">Olanaklar / Facilities</Text>
            </div>

            <Grid>
              <Grid.Col span={4}>
                <NumberInput
                  label="Yatak Odası"
                  placeholder="0"
                  min={0}
                  {...form.getInputProps("bedrooms")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Banyo"
                  placeholder="0"
                  min={0}
                  {...form.getInputProps("bathrooms")}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Otopark"
                  placeholder="0"
                  min={0}
                  {...form.getInputProps("parkings")}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* DAİRE PLANLARI (Floor Plans) */}
          <Paper p="lg" withBorder mb="lg" className="bg-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BsGrid size={24} className="text-green-600" />
                <Text fw={700} size="lg" c="green">Daire Planları</Text>
              </div>
              <Button
                leftSection={<MdAdd size={18} />}
                variant="light"
                color="green"
                size="sm"
                onClick={addFloorPlan}
              >
                Plan Ekle
              </Button>
            </div>

            {form.values.dairePlanlari.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Henüz daire planı eklenmedi. &quot;Plan Ekle&quot; butonuna tıklayın.
              </Text>
            ) : (
              form.values.dairePlanlari.map((plan, index) => (
                <Paper key={index} p="md" withBorder mb="md" className="bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <Text fw={600}>Plan #{index + 1}</Text>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => removeFloorPlan(index)}
                    >
                      <MdDelete size={18} />
                    </ActionIcon>
                  </div>

                  <div className="flex gap-4">
                    {/* Floor Plan Image Upload */}
                    <div className="flex-shrink-0">
                      {plan.image ? (
                        <div className="relative">
                          <Image
                            src={plan.image}
                            w={120}
                            h={120}
                            fit="cover"
                            radius="md"
                          />
                          <ActionIcon
                            color="red"
                            variant="filled"
                            size="sm"
                            className="absolute -top-2 -right-2"
                            onClick={() => {
                              const plans = [...form.values.dairePlanlari];
                              plans[index].image = "";
                              form.setFieldValue("dairePlanlari", plans);
                            }}
                          >
                            <MdClose size={14} />
                          </ActionIcon>
                        </div>
                      ) : (
                        <Button
                          variant="light"
                          color="green"
                          w={120}
                          h={120}
                          onClick={() => openFloorPlanUpload(index)}
                          disabled={floorPlanUploading === index}
                          p={0}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <MdOutlineCloudUpload size={24} />
                            <Text size="xs" ta="center">Plan Görseli</Text>
                          </div>
                        </Button>
                      )}
                    </div>

                    {/* Floor Plan Details */}
                    <div className="flex-1">
                      <Grid>
                        <Grid.Col span={2}>
                          <TextInput
                            label="Daire Tipi"
                            placeholder="2+1"
                            value={plan.tip}
                            onChange={(e) => {
                              const plans = [...form.values.dairePlanlari];
                              plans[index].tip = e.target.value;
                              form.setFieldValue("dairePlanlari", plans);
                            }}
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <TextInput
                            label="Varyant"
                            placeholder="A"
                            value={plan.varyant}
                            onChange={(e) => {
                              const plans = [...form.values.dairePlanlari];
                              plans[index].varyant = e.target.value;
                              form.setFieldValue("dairePlanlari", plans);
                            }}
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <NumberInput
                            label="USD ($)"
                            placeholder="10.850.000"
                            min={0}
                            thousandSeparator="."
                            decimalSeparator=","
                            value={getFloorPlanPriceByCurrency(plan, "USD")}
                            onChange={(value) =>
                              updateFloorPlanPrices(index, "USD", value)
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <NumberInput
                            label="EUR"
                            placeholder="9.950.000"
                            min={0}
                            thousandSeparator="."
                            decimalSeparator=","
                            value={getFloorPlanPriceByCurrency(plan, "EUR")}
                            onChange={(value) =>
                              updateFloorPlanPrices(index, "EUR", value)
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <NumberInput
                            label="TRY (TL)"
                            placeholder="405.000.000"
                            min={0}
                            thousandSeparator="."
                            decimalSeparator=","
                            value={getFloorPlanPriceByCurrency(plan, "TRY")}
                            onChange={(value) =>
                              updateFloorPlanPrices(index, "TRY", value)
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <NumberInput
                            label="Metrekare (m2)"
                            placeholder="57"
                            min={0}
                            value={plan.metrekare}
                            onChange={(value) => {
                              const plans = [...form.values.dairePlanlari];
                              plans[index].metrekare = value || 0;
                              form.setFieldValue("dairePlanlari", plans);
                            }}
                          />
                        </Grid.Col>
                      </Grid>
                    </div>
                  </div>
                </Paper>
              ))
            )}
          </Paper>

          {/* VAZİYET PLANI (Site Plan) */}
          <Paper p="lg" withBorder mb="lg" className="bg-purple-50">
            <div className="flex items-center gap-2 mb-4">
              <MdMap size={24} className="text-purple-600" />
              <Text fw={700} size="lg" c="grape">Vaziyet Planı</Text>
            </div>

            <div className="flex items-start gap-4">
              {form.values.vaziyetPlani ? (
                <div className="relative">
                  <Image
                    src={form.values.vaziyetPlani}
                    w={300}
                    h={200}
                    fit="cover"
                    radius="md"
                  />
                  <ActionIcon
                    color="red"
                    variant="filled"
                    className="absolute -top-2 -right-2"
                    onClick={() => form.setFieldValue("vaziyetPlani", "")}
                  >
                    <MdClose size={16} />
                  </ActionIcon>
                </div>
              ) : (
                <Button
                  variant="light"
                  color="grape"
                  h={200}
                  w={300}
                  onClick={openSitePlanUpload}
                  disabled={imageUploading}
                >
                  <div className="flex flex-col items-center gap-2">
                    <MdOutlineCloudUpload size={40} />
                    <Text size="sm">Vaziyet Planı Yükle</Text>
                  </div>
                </Button>
              )}
            </div>
          </Paper>

          {/* HARİTA GÖRSELİ (Map Image) */}
          <Paper p="lg" withBorder mb="lg" className="bg-cyan-50">
            <div className="flex items-center gap-2 mb-4">
              <MdLocationOn size={24} className="text-cyan-600" />
              <Text fw={700} size="lg" c="cyan">Konum / Harita Görseli</Text>
            </div>

            <div className="flex items-start gap-4">
              {form.values.mapImage ? (
                <div className="relative">
                  <Image
                    src={form.values.mapImage}
                    w={400}
                    h={250}
                    fit="cover"
                    radius="md"
                  />
                  <ActionIcon
                    color="red"
                    variant="filled"
                    className="absolute -top-2 -right-2"
                    onClick={() => form.setFieldValue("mapImage", "")}
                  >
                    <MdClose size={16} />
                  </ActionIcon>
                </div>
              ) : (
                <Button
                  variant="light"
                  color="cyan"
                  h={250}
                  w={400}
                  onClick={openMapImageUpload}
                  disabled={mapImageUploading}
                >
                  <div className="flex flex-col items-center gap-2">
                    <MdOutlineCloudUpload size={40} />
                    <Text size="sm">Harita Görseli Yükle</Text>
                    <Text size="xs" c="dimmed">Google Maps screenshot veya harita görseli</Text>
                  </div>
                </Button>
              )}
            </div>
          </Paper>

          {/* ÖZELLİKLER (Features) */}
          <Paper p="lg" withBorder mb="lg">
            <div className="flex items-center gap-2 mb-4">
              <BsBuilding size={24} className="text-gray-600" />
              <Text fw={700} size="lg">Özellikler</Text>
            </div>

            <Tabs defaultValue="bina" variant="outline">
              <Tabs.List>
                <Tabs.Tab value="bina" leftSection={<BsBuilding size={14} />}>
                  Bina Özellikleri
                </Tabs.Tab>
                <Tabs.Tab value="dis" leftSection={<BsTree size={14} />}>
                  Dış Özellikler
                </Tabs.Tab>
                <Tabs.Tab value="engelli" leftSection={<FaWheelchair size={14} />}>
                  Engelliye ve Yaşlıya Uygun
                </Tabs.Tab>
                <Tabs.Tab value="eglence" leftSection={<FaShoppingCart size={14} />}>
                  Eğlence & Alışveriş
                </Tabs.Tab>
                <Tabs.Tab value="guvenlik" leftSection={<BsShield size={14} />}>
                  Güvenlik
                </Tabs.Tab>
                <Tabs.Tab value="manzara" leftSection={<BsEye size={14} />}>
                  Manzara
                </Tabs.Tab>
                <Tabs.Tab value="muhit" leftSection={<BsPeople size={14} />}>
                  Muhit
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="bina" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {BINA_OZELLIKLERI.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.binaOzellikleri.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("binaOzellikleri", [...form.values.binaOzellikleri, feature]);
                        } else {
                          form.setFieldValue("binaOzellikleri", form.values.binaOzellikleri.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="dis" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {DIS_OZELLIKLER.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.disOzellikler.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("disOzellikler", [...form.values.disOzellikler, feature]);
                        } else {
                          form.setFieldValue("disOzellikler", form.values.disOzellikler.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="engelli" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {ENGELLI_YASLI_UYGUN.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.engelliYasliUygun.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("engelliYasliUygun", [...form.values.engelliYasliUygun, feature]);
                        } else {
                          form.setFieldValue("engelliYasliUygun", form.values.engelliYasliUygun.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="eglence" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {EGLENCE_ALISVERIS.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.eglenceAlisveris.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("eglenceAlisveris", [...form.values.eglenceAlisveris, feature]);
                        } else {
                          form.setFieldValue("eglenceAlisveris", form.values.eglenceAlisveris.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="guvenlik" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {GUVENLIK.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.guvenlik.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("guvenlik", [...form.values.guvenlik, feature]);
                        } else {
                          form.setFieldValue("guvenlik", form.values.guvenlik.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="manzara" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {MANZARA.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.manzara.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("manzara", [...form.values.manzara, feature]);
                        } else {
                          form.setFieldValue("manzara", form.values.manzara.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="muhit" pt="md">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {MUHIT.map((feature) => (
                    <Checkbox
                      key={feature}
                      label={feature}
                      size="sm"
                      checked={form.values.muhit.includes(feature)}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue("muhit", [...form.values.muhit, feature]);
                        } else {
                          form.setFieldValue("muhit", form.values.muhit.filter((f) => f !== feature));
                        }
                      }}
                    />
                  ))}
                </div>
              </Tabs.Panel>
            </Tabs>
          </Paper>

          <Group justify="center" mt="xl">
            <Button variant="default" onClick={prevStep}>
              Geri
            </Button>
            <Button type="submit" color="blue">
              İleri
            </Button>
          </Group>
        </form>
      </ScrollArea>
    </Box>
  );
};

ProjectDetails.propTypes = {
  prevStep: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  propertyDetails: PropTypes.object.isRequired,
  setPropertyDetails: PropTypes.func.isRequired,
};

export default ProjectDetails;
