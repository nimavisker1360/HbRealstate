export const updateFavourites = (id, favourites) => {
  if (favourites.includes(id)) {
    return favourites.filter((resId) => resId !== id);
  } else {
    return [...favourites, id];
  }
};

export const checkFavourites = (id, favourites) => {
  return favourites?.includes(id) ? "#8ac243" : "white";
};

export const validateString = (value) => {
  return value?.length < 3 || value === null
    ? "Enter at least 3 characters"
    : null;
};

export const normalizeWhatsAppNumber = (value) => {
  const digits = value?.toString().replace(/\D/g, "") || "";
  return digits.startsWith("00") ? digits.slice(2) : digits;
};
