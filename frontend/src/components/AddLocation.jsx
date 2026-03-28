import { useForm } from "@mantine/form";
import { Button, Group, Select, TextInput, Text, Divider } from "@mantine/core";
import useCountries from "../hooks/useCountries";
import Map from "./Map";
import { validateString } from "../utils/common";
import PropTypes from "prop-types";
import { MdSell, MdBusiness, MdPublic } from "react-icons/md";
import {
  LOCAL_PROJECT_CITY_OPTIONS,
  LOCAL_PROJECT_DEFAULT_COUNTRY,
  LOCAL_PROJECT_DISTRICT_OPTIONS,
} from "../constant/projectLocationOptions";

const AddLocation = ({ propertyDetails, setPropertyDetails, nextStep }) => {
  const { getAll } = useCountries();

  const form = useForm({
    initialValues: {
      country:
        propertyDetails?.country ||
        (["sale", "local-project"].includes(propertyDetails?.propertyType)
          ? LOCAL_PROJECT_DEFAULT_COUNTRY
          : ""),
      city: propertyDetails?.city,
      address: propertyDetails?.address,
      propertyType: propertyDetails?.propertyType || "sale",
    },
    validate: {
      country: (value) => validateString(value),
      city: (value) => validateString(value),
      address: (value) => validateString(value),
    },
  });

  const { country, city, address, propertyType } = form.values;
  const isTurkeyLocationType =
    propertyType === "sale" || propertyType === "local-project";
  const districtOptions = isTurkeyLocationType
    ? (LOCAL_PROJECT_DISTRICT_OPTIONS[city] || []).map((district) => ({
        value: district,
        label: district,
      }))
    : [];

  const handlePropertyTypeChange = (nextType) => {
    form.setFieldValue("propertyType", nextType);

    if (!["sale", "local-project"].includes(nextType)) {
      return;
    }

    form.setFieldValue("country", LOCAL_PROJECT_DEFAULT_COUNTRY);

    const hasMatchingCity = LOCAL_PROJECT_CITY_OPTIONS.some(
      (option) => option.value === form.values.city
    );

    if (!hasMatchingCity || !LOCAL_PROJECT_DISTRICT_OPTIONS[form.values.city]) {
      form.setFieldValue("city", "");
      form.setFieldValue("address", "");
      return;
    }

    if (!LOCAL_PROJECT_DISTRICT_OPTIONS[form.values.city].includes(form.values.address)) {
      form.setFieldValue("address", "");
    }
  };

  const handleCityChange = (value) => {
    const nextCity = value || "";
    form.setFieldValue("city", nextCity);

    if (!isTurkeyLocationType) {
      return;
    }

    const nextDistricts = LOCAL_PROJECT_DISTRICT_OPTIONS[nextCity] || [];
    if (!nextDistricts.includes(form.values.address)) {
      form.setFieldValue("address", "");
    }
  };

  const handleSubmit = () => {
    const { hasErrors } = form.validate();
    if (!hasErrors) {
      setPropertyDetails((prev) => ({ ...prev, country, city, address, propertyType }));
      nextStep();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {/* Property Type Selector */}
      <div className="mb-6">
        <Text size="sm" fw={500} mb={8}>
          Emlak Tipi <span className="text-red-500">*</span>
        </Text>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handlePropertyTypeChange("sale")}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              propertyType === "sale"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-green-200"
            }`}
          >
            <MdSell size={28} />
            <span className="font-medium text-sm">Satılık</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePropertyTypeChange("local-project")}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              propertyType === "local-project"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <MdBusiness size={28} />
            <span className="font-medium text-sm">Yurt İçi Proje</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePropertyTypeChange("international-project")}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
              propertyType === "international-project"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <MdPublic size={28} />
            <span className="font-medium text-sm">Yurt Dışı Proje</span>
          </button>
          
        </div>
      </div>

      <Divider my="lg" label="Konum Bilgileri" labelPosition="center" />

      <div className="flexCenter">
        {/* left */}
        <div className="flexCenter flex-1">
          <div>
            <Select
              w={"100%"}
              withAsterisk
              label="Country"
              clearable={!isTurkeyLocationType}
              searchable={!isTurkeyLocationType}
              disabled={isTurkeyLocationType}
              data={
                isTurkeyLocationType
                  ? [
                      {
                        value: LOCAL_PROJECT_DEFAULT_COUNTRY,
                        label: LOCAL_PROJECT_DEFAULT_COUNTRY,
                      },
                    ]
                  : getAll()
              }
              {...form.getInputProps("country", { type: "input" })}
            />
            {isTurkeyLocationType ? (
              <Select
                w={"100%"}
                withAsterisk
                label="City"
                placeholder="Şehir seçin"
                searchable
                data={LOCAL_PROJECT_CITY_OPTIONS}
                value={city || null}
                onChange={handleCityChange}
                error={form.errors.city}
                nothingFoundMessage="Şehir bulunamadı"
              />
            ) : (
              <TextInput
                w={"100%"}
                withAsterisk
                label="City"
                {...form.getInputProps("city", { type: "input" })}
              />
            )}
            {isTurkeyLocationType ? (
              <Select
                w={"100%"}
                withAsterisk
                label="İlçe"
                placeholder={city ? "İlçe seçin" : "Önce şehir seçin"}
                searchable
                disabled={!city}
                data={districtOptions}
                value={address || null}
                onChange={(value) => form.setFieldValue("address", value || "")}
                error={form.errors.address}
                nothingFoundMessage="İlçe bulunamadı"
              />
            ) : (
              <TextInput
                w={"100%"}
                withAsterisk
                label="Address"
                {...form.getInputProps("address", { type: "input" })}
              />
            )}
          </div>
        </div>
        {/* right */}
        <div className="flex-1">
          <Map country={country} city={city} address={address} />
        </div>
      </div>
      <Group position="center" mt="xl">
        <Button type="submit">Next step</Button>
      </Group>
    </form>
  );
};

AddLocation.propTypes = {
  propertyDetails: PropTypes.object,
  setPropertyDetails: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
};

export default AddLocation;
