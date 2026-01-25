import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { Auth0Provider } from "@auth0/auth0-react";
import { MantineProvider } from "@mantine/core";
import "./i18n"; // Initialize i18n

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-pdz8rd3zuiwyzqzo.us.auth0.com"
      clientId="BxBZ7tbUCQk1y0zngWitB0k0vTdIACft"
      authorizationParams={{
        redirect_uri: window.location.origin,
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <MantineProvider>
        <App />
      </MantineProvider>
    </Auth0Provider>
  </React.StrictMode>
);
