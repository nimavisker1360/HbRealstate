import { useContext } from "react";
import PropTypes from "prop-types";
import useAuthCheck from "../hooks/useAuthCheck";
import { useMutation } from "react-query";
import { useAuth0 } from "@auth0/auth0-react";
import UserDetailContext from "../context/UserDetailContext";
import { toFav } from "../utils/api";
import { updateFavourites } from "../utils/common";
import { toast } from "react-toastify";
import { bilingualKey } from "../utils/bilingualToast";

const HeartIcon = ({ active, size }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    aria-hidden="true"
    fill={active ? "#16a34a" : "#ffffff"}
    stroke={active ? "#15803d" : "#ef4444"}
    strokeWidth={active ? 2.35 : 2.15}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      filter: "drop-shadow(0 1px 2px rgba(15,23,42,0.2))",
    }}
  >
    <path d="M12 20.55 10.55 19.23C5.4 14.56 2 11.48 2 7.7 2 4.62 4.42 2.2 7.5 2.2c1.74 0 3.41.81 4.5 2.09 1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.53L12 20.55Z" />
  </svg>
);

HeartIcon.propTypes = {
  active: PropTypes.bool.isRequired,
  size: PropTypes.number.isRequired,
};

const HeartBtn = ({ id, className = "", size = 23 }) => {
  const { validateLogin } = useAuthCheck();
  const { user } = useAuth0();

  const {
    userDetails: { favourites, token },
    setUserDetails,
  } = useContext(UserDetailContext);
  const favouriteIds = Array.isArray(favourites) ? favourites : [];
  const isFavourite = favouriteIds.includes(id);

  const { mutate } = useMutation({
    mutationFn: () => toFav(id, user?.email, token),
    onSuccess: () => {
      setUserDetails((prev) => ({
        ...prev,
        favourites: updateFavourites(id, prev.favourites || []),
      }));
      toast.success(
        bilingualKey(
          isFavourite
            ? "favorites.removedFromFavorites"
            : "favorites.addedToFavorites"
        )
      );
    },
  });

  const handleLike = () => {
    if (validateLogin()) {
      mutate();
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleLike();
      }}
      className={`group inline-flex items-center justify-center cursor-pointer drop-shadow-sm ${className}`.trim()}
      aria-pressed={isFavourite}
      aria-label={
        isFavourite
          ? "Remove from favourites"
          : "Add to favourites"
      }
    >
      <span className="transition-transform duration-150 group-hover:scale-105">
        <HeartIcon active={isFavourite} size={size} />
      </span>
    </button>
  );
};

HeartBtn.propTypes = {
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
};

export default HeartBtn;
