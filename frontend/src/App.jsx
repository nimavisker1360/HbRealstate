import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Listing from "./pages/Listing";
import AddProperty from "./pages/AddProperty";
import AdminPanel from "./pages/AdminPanel";
import Consultants from "./pages/Consultants";
import TodayProperties from "./pages/TodayProperties";
import BlogsPage from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";
import Addresses from "./pages/Addresses";
import LocalProjects from "./pages/LocalProjects";
import ProjectDetail from "./pages/ProjectDetail";
import TestimonialsTest from "./pages/TestimonialsTest";
import { QueryClient, QueryClientProvider } from "react-query"
import { ToastContainer } from "react-toastify";
import { ReactQueryDevtools } from 'react-query/devtools';
import "react-toastify/dist/ReactToastify.css"
import Property from "./pages/Property";
import { Suspense, useState, useEffect } from "react";
import UserDetailContext from "./context/UserDetailContext";
import Layout from "./components/Layout";
import Favourites from "./pages/Favourites";
import Bookings from "./pages/Bookings";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {

  const queryClient = new QueryClient();
  const [userDetails, setUserDetails] = useState({
    favourites: [],
    bookings: [],
    token: null
  })

  // Scroll to top on initial load and disable browser scroll restoration
  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  return (
    <UserDetailContext.Provider  value={{ userDetails, setUserDetails }} >
      <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<div>Loading data...</div>}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/listing" >
                    <Route index element={<Listing />} />
                    <Route path=":propertyId" element={<Property />} />
                  </Route>
                  <Route path="/addproperty" element={<AddProperty />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/favourites" element={<Favourites />} />
                  <Route path="/consultants" element={<Consultants />} />
                  <Route path="/today" element={<TodayProperties />} />
                  <Route path="/blogs" element={<BlogsPage />} />
                  <Route path="/blog/:blogId" element={<BlogPost />} />
                  <Route path="/testimonials-test" element={<TestimonialsTest />} />
                  <Route path="/addresses" element={<Addresses />} />
                  <Route path="/projects" element={<LocalProjects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        <ToastContainer />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </UserDetailContext.Provider>
  )
}
