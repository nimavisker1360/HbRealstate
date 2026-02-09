import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container,
  Button,
  TextInput,
  Popover,
  Checkbox,
  ScrollArea,
  Loader,
} from "@mantine/core";
import { MdSearch, MdKeyboardArrowDown } from "react-icons/md";
import heroBg from "../assets/img4.png";
import useProperties from "../hooks/useProperties";
import CurrencyContext from "../context/CurrencyContext";

// Turkish cities data
const TURKISH_CITIES = [
  { value: "", label: "Tüm Şehirler" },
  { value: "istanbul-tumu", label: "İstanbul (Tümü)" },
  { value: "istanbul-avrupa", label: "İstanbul (Avrupa)" },
  { value: "istanbul-anadolu", label: "İstanbul (Anadolu)" },
  { value: "ankara", label: "Ankara" },
  { value: "izmir", label: "İzmir" },
  { value: "adana", label: "Adana" },
  { value: "adiyaman", label: "Adıyaman" },
  { value: "afyonkarahisar", label: "Afyonkarahisar" },
  { value: "antalya", label: "Antalya" },
  { value: "bursa", label: "Bursa" },
  { value: "denizli", label: "Denizli" },
  { value: "diyarbakir", label: "Diyarbakır" },
  { value: "eskisehir", label: "Eskişehir" },
  { value: "gaziantep", label: "Gaziantep" },
  { value: "kayseri", label: "Kayseri" },
  { value: "kocaeli", label: "Kocaeli" },
  { value: "konya", label: "Konya" },
  { value: "mersin", label: "Mersin" },
  { value: "mugla", label: "Muğla" },
  { value: "sakarya", label: "Sakarya" },
  { value: "samsun", label: "Samsun" },
  { value: "trabzon", label: "Trabzon" },
];

// Districts by city
const CITY_DISTRICTS = {
  "istanbul-tumu": [
    "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler",
    "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü",
    "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt",
    "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane",
    "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer",
    "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla",
    "Ümraniye", "Üsküdar", "Zeytinburnu"
  ],
  "istanbul-avrupa": [
    "Arnavutköy", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir",
    "Bayrampaşa", "Beşiktaş", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca",
    "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören",
    "Kağıthane", "Küçükçekmece", "Sarıyer", "Silivri", "Sultangazi", "Şişli", "Zeytinburnu"
  ],
  "istanbul-anadolu": [
    "Adalar", "Ataşehir", "Beykoz", "Çekmeköy", "Kadıköy", "Kartal", "Maltepe",
    "Pendik", "Sancaktepe", "Sultanbeyli", "Şile", "Tuzla", "Ümraniye", "Üsküdar"
  ],
  "ankara": [
    "Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya",
    "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana",
    "Kalecik", "Kahramankazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan",
    "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"
  ],
  "izmir": [
    "Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova",
    "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe",
    "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz",
    "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar",
    "Selçuk", "Tire", "Torbalı", "Urla"
  ],
  "antalya": [
    "Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike",
    "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı",
    "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"
  ],
  "bursa": [
    "Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey",
    "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli",
    "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"
  ],
  "adana": [
    "Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş",
    "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"
  ],
  "konya": [
    "Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli",
    "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli",
    "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar",
    "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent",
    "Tuzlukçu", "Yalıhüyük", "Yunak"
  ],
  "gaziantep": [
    "Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"
  ],
  "mersin": [
    "Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar",
    "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"
  ],
  "kocaeli": [
    "Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük",
    "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"
  ],
  "kayseri": [
    "Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan",
    "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"
  ],
  "denizli": [
    "Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan",
    "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi",
    "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"
  ],
  "eskisehir": [
    "Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye",
    "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"
  ],
  "diyarbakir": [
    "Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani",
    "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"
  ],
  "samsun": [
    "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba",
    "Havza", "İlkadım", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"
  ],
  "trabzon": [
    "Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı",
    "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"
  ],
  "sakarya": [
    "Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek",
    "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"
  ],
  "mugla": [
    "Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris",
    "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"
  ],
  "adiyaman": [
    "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"
  ],
  "afyonkarahisar": [
    "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ",
    "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı",
    "Sinanpaşa", "Sultandağı", "Şuhut"
  ],
};

// Room options
const ROOM_OPTIONS = [
  { value: "1+0", label: "Stüdyo (1+0)" },
  { value: "1+1", label: "1+1" },
  { value: "1.5+1", label: "1.5+1" },
  { value: "2+0", label: "2+0" },
  { value: "2+1", label: "2+1" },
  { value: "2.5+1", label: "2.5+1" },
  { value: "2+2", label: "2+2" },
  { value: "3+0", label: "3+0" },
  { value: "3+1", label: "3+1" },
  { value: "3.5+1", label: "3.5+1" },
  { value: "3+2", label: "3+2" },
  { value: "4+1", label: "4+1" },
  { value: "4+2", label: "4+2" },
  { value: "5+1", label: "5+1" },
  { value: "5+2", label: "5+2" },
];

// Project status options
const PROJECT_STATUS = [
  { value: "devam-ediyor", label: "Devam Ediyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
];

const LocalProjects = () => {
  const navigate = useNavigate();
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);
  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;
  const { t, i18n } = useTranslation();
  const { data: allProperties, isLoading } = useProperties();

  // Filter local projects from all properties
  const localProjects = useMemo(() => {
    if (!allProperties) return [];
    
    // Only filter properties with propertyType === "local-project"
    const filtered = allProperties.filter((p) => {
      return p.propertyType === "local-project";
    });
    
    return filtered.map((p) => {
      // Calculate starting price from floor plans if main price is 0
      const floorPlanPrices = p.dairePlanlari?.map((d) => d.fiyat || 0).filter(price => price > 0) || [];
      const startingPrice = p.price > 0 ? p.price : (floorPlanPrices.length > 0 ? Math.min(...floorPlanPrices) : 0);
      
      return {
        id: p.id,
        name: p.title,
        city: p.city || "",
        district: p.address || "",
        address: p.address || "",
        rooms: p.dairePlanlari?.map((d) => d.tip).filter((v, i, a) => a.indexOf(v) === i) || [],
        areaMin: Math.min(...(p.dairePlanlari?.map((d) => d.metrekare) || [0])),
        areaMax: Math.max(...(p.dairePlanlari?.map((d) => d.metrekare) || [0])),
        price: startingPrice,
        deliveryDate: p.deliveryDate || "",
        status: p.projectStatus || "devam-ediyor",
        image: p.images?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
        projeHakkinda: p.projeHakkinda,
        dairePlanlari: p.dairePlanlari,
        vaziyetPlani: p.vaziyetPlani,
        ozellikler: p.ozellikler,
        kampanya: p.kampanya,
        mapImage: p.mapImage,
      };
    });
  }, [allProperties]);

  // Filter states
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [districtSearch, setDistrictSearch] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [projectStatus, setProjectStatus] = useState("");

  // Popover states
  const [cityPopoverOpened, setCityPopoverOpened] = useState(false);
  const [districtPopoverOpened, setDistrictPopoverOpened] = useState(false);
  const [roomPopoverOpened, setRoomPopoverOpened] = useState(false);
  const [statusPopoverOpened, setStatusPopoverOpened] = useState(false);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return TURKISH_CITIES;
    return TURKISH_CITIES.filter((city) =>
      city.label.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [citySearch]);

  // Get districts for selected city
  const currentCityDistricts = useMemo(() => {
    return CITY_DISTRICTS[selectedCity] || [];
  }, [selectedCity]);

  // Filter districts based on search
  const filteredDistricts = useMemo(() => {
    if (!districtSearch) return currentCityDistricts;
    return currentCityDistricts.filter((district) =>
      district.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [districtSearch, currentCityDistricts]);

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!roomSearch) return ROOM_OPTIONS;
    return ROOM_OPTIONS.filter((room) =>
      room.label.toLowerCase().includes(roomSearch.toLowerCase())
    );
  }, [roomSearch]);

  // Handle search - filtering happens automatically, this just closes popovers
  const handleSearch = () => {
    setCityPopoverOpened(false);
    setDistrictPopoverOpened(false);
    setRoomPopoverOpened(false);
    setStatusPopoverOpened(false);
  };

  const toggleDistrict = (district) => {
    setSelectedDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  };

  const toggleRoom = (room) => {
    setSelectedRooms((prev) =>
      prev.includes(room)
        ? prev.filter((r) => r !== room)
        : [...prev, room]
    );
  };

  // Check if selected city has districts
  const hasDistricts = currentCityDistricts.length > 0;

  // Clear districts when city changes
  const handleCityChange = (cityValue) => {
    setSelectedCity(cityValue);
    setSelectedDistricts([]); // Reset districts when city changes
  };

  // Helper function to normalize city name for comparison
  const normalizeCityName = (cityName) => {
    if (!cityName) return "";
    return cityName
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .trim();
  };

  // Filter projects based on selected filters
  const filteredProjects = useMemo(() => {
    return localProjects.filter((project) => {
      // Filter by city
      if (selectedCity) {
        const projectCity = normalizeCityName(project.city);
        const selectedCityBase = selectedCity.replace(/-tumu|-avrupa|-anadolu/g, "");
        const normalizedSelectedCity = normalizeCityName(selectedCityBase);
        
        // Check if project city contains the selected city
        if (!projectCity.includes(normalizedSelectedCity)) {
          return false;
        }
        
        // For Istanbul sub-regions, check the district
        if (selectedCity === "istanbul-avrupa" || selectedCity === "istanbul-anadolu") {
          const projectDistrict = normalizeCityName(project.district || project.address);
          const istanbulEuropeDistricts = CITY_DISTRICTS["istanbul-avrupa"].map(d => normalizeCityName(d));
          const istanbulAsiaDistricts = CITY_DISTRICTS["istanbul-anadolu"].map(d => normalizeCityName(d));
          
          if (selectedCity === "istanbul-avrupa") {
            const isInEurope = istanbulEuropeDistricts.some(d => projectDistrict.includes(d));
            if (!isInEurope) return false;
          } else if (selectedCity === "istanbul-anadolu") {
            const isInAsia = istanbulAsiaDistricts.some(d => projectDistrict.includes(d));
            if (!isInAsia) return false;
          }
        }
      }

      // Filter by district
      if (selectedDistricts.length > 0) {
        const projectAddress = normalizeCityName(project.address || project.district);
        const matchesDistrict = selectedDistricts.some(district => 
          projectAddress.includes(normalizeCityName(district))
        );
        if (!matchesDistrict) return false;
      }

      // Filter by project status
      if (projectStatus && project.status !== projectStatus) {
        return false;
      }

      return true;
    });
  }, [localProjects, selectedCity, selectedDistricts, projectStatus]);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f7f3ea]">
      {/* Hero Section - Compact */}
      <Container size="lg" className="py-4">
        <div className="relative rounded-xl overflow-hidden h-auto min-h-[450px] md:min-h-[280px]">
          {/* Background Image */}
          <img
            src={heroBg}
            alt="Konut Projeleri"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center px-4 py-6 md:py-4">
            <h1 className="text-white text-xl md:text-2xl font-medium mb-6 text-center drop-shadow-lg">
              {t("localProjects.heroTitle")}
            </h1>

            {/* Search Box */}
            <div className="bg-white rounded-lg border-[3px] border-slate-200 shadow-[0_20px_55px_rgba(15,23,42,0.28)] ring-2 ring-white/70 flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-gray-200 w-full max-w-4xl mx-4">
              {/* City Select */}
              <Popover
                opened={cityPopoverOpened}
                onChange={setCityPopoverOpened}
                width={220}
                position="bottom-start"
                shadow="md"
              >
                <Popover.Target>
                  <button
                    className="flex items-center justify-between gap-2 px-4 py-3 md:py-2.5 md:min-w-[140px] transition-colors w-full md:w-auto"
                    onClick={() => setCityPopoverOpened((o) => !o)}
                  >
                    <span className="text-sm text-gray-700">
                      {TURKISH_CITIES.find(c => c.value === selectedCity)?.label || t("localProjects.city")}
                    </span>
                    <MdKeyboardArrowDown className="text-gray-400" size={18} />
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="p-0">
                  <div className="p-2 border-b">
                    <TextInput
                      placeholder={`${t("localProjects.search")}...`}
                      size="xs"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      rightSection={<MdSearch size={14} />}
                    />
                  </div>
                  <ScrollArea h={200} className="p-1">
                    {filteredCities.map((city) => (
                      <div
                        key={city.value}
                        className={`px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-blue-50 ${
                          selectedCity === city.value ? "bg-blue-500 text-white hover:bg-blue-500" : "text-gray-700"
                        }`}
                        onClick={() => {
                          handleCityChange(city.value);
                          setCityPopoverOpened(false);
                          setCitySearch("");
                        }}
                      >
                        {city.label}
                      </div>
                    ))}
                  </ScrollArea>
                </Popover.Dropdown>
              </Popover>

              {/* District Select */}
              <Popover
                opened={districtPopoverOpened}
                onChange={setDistrictPopoverOpened}
                width={220}
                position="bottom-start"
                shadow="md"
                disabled={!hasDistricts}
              >
                <Popover.Target>
                  <button
                    className={`flex items-center justify-between gap-2 px-4 py-3 md:py-2.5 md:min-w-[100px] transition-colors w-full md:w-auto ${
                      !hasDistricts ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => hasDistricts && setDistrictPopoverOpened((o) => !o)}
                  >
                    <span className="text-sm text-gray-700">
                      {selectedDistricts.length > 0 ? `${selectedDistricts.length} ${t("localProjects.district")}` : t("localProjects.district")}
                    </span>
                    <MdKeyboardArrowDown className="text-gray-400" size={18} />
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="p-0">
                  <div className="p-2 border-b">
                    <TextInput
                      placeholder={t("localProjects.district")}
                      size="xs"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      rightSection={<MdSearch size={14} />}
                    />
                  </div>
                  <ScrollArea h={200} className="p-2">
                    {filteredDistricts.map((district) => (
                      <Checkbox
                        key={district}
                        label={district}
                        size="xs"
                        checked={selectedDistricts.includes(district)}
                        onChange={() => toggleDistrict(district)}
                        className="py-1"
                      />
                    ))}
                  </ScrollArea>
                </Popover.Dropdown>
              </Popover>

              {/* Room Select */}
              <Popover
                opened={roomPopoverOpened}
                onChange={setRoomPopoverOpened}
                width={180}
                position="bottom-start"
                shadow="md"
              >
                <Popover.Target>
                  <button
                    className="flex items-center justify-between gap-2 px-4 py-3 md:py-2.5 md:min-w-[110px] transition-colors w-full md:w-auto"
                    onClick={() => setRoomPopoverOpened((o) => !o)}
                  >
                    <span className="text-sm text-gray-700">
                      {selectedRooms.length > 0 ? `${selectedRooms.length} ${t("localProjects.rooms")}` : t("localProjects.selectRooms")}
                    </span>
                    <MdKeyboardArrowDown className="text-gray-400" size={18} />
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="p-0">
                  <div className="p-2 border-b">
                    <TextInput
                      placeholder={t("localProjects.rooms")}
                      size="xs"
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      rightSection={<MdSearch size={14} />}
                    />
                  </div>
                  <ScrollArea h={200} className="p-2">
                    {filteredRooms.map((room) => (
                      <Checkbox
                        key={room.value}
                        label={room.label}
                        size="xs"
                        checked={selectedRooms.includes(room.value)}
                        onChange={() => toggleRoom(room.value)}
                        className="py-1"
                      />
                    ))}
                  </ScrollArea>
                </Popover.Dropdown>
              </Popover>

              {/* Project Status Select */}
              <Popover
                opened={statusPopoverOpened}
                onChange={setStatusPopoverOpened}
                width={160}
                position="bottom-start"
                shadow="md"
              >
                <Popover.Target>
                  <button
                    className="flex items-center justify-between gap-2 px-4 py-3 md:py-2.5 md:min-w-[120px] transition-colors w-full md:w-auto"
                    onClick={() => setStatusPopoverOpened((o) => !o)}
                  >
                    <span className="text-sm text-gray-700">
                      {projectStatus
                        ? (projectStatus === "devam-ediyor" ? t("localProjects.ongoing") : t("localProjects.completed"))
                        : t("localProjects.projectStatus")}
                    </span>
                    <MdKeyboardArrowDown className="text-gray-400" size={18} />
                  </button>
                </Popover.Target>
                <Popover.Dropdown className="p-1">
                  {PROJECT_STATUS.map((status) => (
                    <div
                      key={status.value}
                      className={`px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-blue-50 ${
                        projectStatus === status.value ? "bg-blue-500 text-white hover:bg-blue-500" : "text-gray-700"
                      }`}
                      onClick={() => {
                        setProjectStatus(status.value);
                        setStatusPopoverOpened(false);
                      }}
                    >
                      {status.value === "devam-ediyor" ? t("localProjects.ongoing") : t("localProjects.completed")}
                    </div>
                  ))}
                </Popover.Dropdown>
              </Popover>

              {/* Search Button */}
              <Button
                color="blue"
                size="sm"
                className="rounded-none md:rounded-r-md rounded-b-md w-full md:w-auto"
                style={{ height: "46px" }}
                onClick={handleSearch}
              >
                {t("localProjects.search")}
              </Button>
            </div>
          </div>
        </div>
      </Container>

      {/* Projects Listing Section */}
      <Container size="lg" className="py-8">
        {/* Active Filters Summary */}
        {(selectedCity || selectedDistricts.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-slate-500 text-sm">{t("localProjects.activeFilters")}:</span>
            
            {selectedCity && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs">
                {TURKISH_CITIES.find(c => c.value === selectedCity)?.label}
                <button
                  onClick={() => handleCityChange("")}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            
            {selectedDistricts.map(district => (
              <span key={district} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs">
                {district}
                <button
                  onClick={() => toggleDistrict(district)}
                  className="ml-1 hover:text-emerald-900"
                >
                  ×
                </button>
              </span>
            ))}
            
            <button
              onClick={() => {
                setSelectedCity("");
                setSelectedDistricts([]);
                setProjectStatus("");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 underline ml-2"
            >
              {t("localProjects.clearAll")}
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="text-slate-600 text-sm mb-4">
          {filteredProjects.length} {t("localProjects.projectsFound")}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !projectStatus
                ? "text-slate-900 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setProjectStatus("")}
          >
            {t("localProjects.allProjects")}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              projectStatus === "devam-ediyor"
                ? "text-slate-900 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setProjectStatus("devam-ediyor")}
          >
            {t("localProjects.ongoing")}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              projectStatus === "tamamlandi"
                ? "text-slate-900 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setProjectStatus("tamamlandi")}
          >
            {t("localProjects.completed")}
          </button>
        </div>

        {/* Project Cards */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Project Image */}
                  <div className="w-full md:w-40 h-32 md:h-24 flex-shrink-0">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 p-3">
                    {/* Top Row: Location, Rooms, Area */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-2">
                      {/* Location */}
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}
                          className="text-blue-500 underline hover:text-blue-600 transition-colors"
                        >
                          {project.city}, {project.district}
                        </button>
                      </div>

                      {/* Room Types */}
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{project.rooms.join(" ")}</span>
                      </div>

                      {/* Area */}
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>
                          {project.areaMin === project.areaMax
                            ? `${project.areaMin} m²`
                            : `${project.areaMin} - ${project.areaMax} m²`}{" "}
                          <span className="text-gray-400">({t("localProjects.gross")})</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Price and Delivery */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800">
                        {project.price > 0 ? (
                          <>
                            <span className="text-gray-500 font-normal">{t("localProjects.startingFrom", "Başlangıç")}: </span>
                            {formatMoney(
                              convertAmount(
                                project.price,
                                project.currency || baseCurrency,
                                displayCurrency
                              ),
                              displayCurrency,
                              i18n.language === "tr" ? "tr-TR" : "en-US"
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">{t("localProjects.contactForPrice", "Fiyat için iletişime geçin")}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.deliveryDate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        )}

        {/* Show message if no projects */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>{t("localProjects.noProjectsFound")}</p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default LocalProjects;

