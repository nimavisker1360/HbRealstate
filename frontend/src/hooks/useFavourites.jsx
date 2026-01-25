import { useContext, useEffect, useRef } from 'react'
import UserDetailContext from '../context/UserDetailContext'
import { useQuery } from 'react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { getAllFav } from '../utils/api'

const useFavourites = () => {
    
    const { userDetails, setUserDetails } = useContext(UserDetailContext)
    const queryRef = useRef()
    const { user, isAuthenticated } = useAuth0()

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: "allFavourites",
        queryFn: ()=> getAllFav(user?.email, userDetails?.token),
        onSuccess: (data)=> setUserDetails((prev)=> ({...prev, favourites: data})),
        // Only enable when user is authenticated AND we have a fresh token
        enabled: isAuthenticated && user !== undefined && !!userDetails?.token,
        staleTime: 30000,
        retry: false // Don't retry on token errors
    })

    queryRef.current = refetch;

    useEffect(()=> {
        // Only refetch when token changes and we have a valid token
        if (userDetails?.token && queryRef.current) {
            queryRef.current()
        }
    }, [userDetails?.token])
    
    return { data, isError, isLoading, refetch }
}

export default useFavourites