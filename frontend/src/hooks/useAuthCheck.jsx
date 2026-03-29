import {useAuth0} from "@auth0/auth0-react"
import { toast } from "react-toastify"
import { bilingualKey } from "../utils/bilingualToast"
import { requestLoginModal } from "../utils/loginPrompt"

const useAuthCheck = () => {

    const { isAuthenticated } = useAuth0()
    const validateLogin = ({ openModal = false, showToast } = {}) => {
        const shouldShowToast =
          typeof showToast === "boolean" ? showToast : !openModal

        if(!isAuthenticated){
            if (openModal) {
              requestLoginModal({ source: "auth_check" })
            }

            if (shouldShowToast) {
              toast.error(bilingualKey("toast.loginFirst"), {position: "bottom-right"})
            }
            return false
        } else return true
    }
  return (
    {validateLogin}
  )
}

export default useAuthCheck
