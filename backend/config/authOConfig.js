import { auth } from "express-oauth2-jwt-bearer";
import { loadBackendEnv } from "./loadEnv.js";

loadBackendEnv();

const fallbackAudience = "N7a0UjSNt8egPgXFOZI5EZifFeCekPoP";
const fallbackIssuerBaseURL = "https://dev-pdz8rd3zuiwyzqzo.us.auth0.com/";
const auth0Domain = String(process.env.AUTH0_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");
const issuerBaseURL =
  process.env.AUTH0_ISSUER_BASE_URL ||
  (auth0Domain ? `https://${auth0Domain}/` : fallbackIssuerBaseURL);

const jwtCheck = auth({
  audience:
    process.env.AUTH0_AUDIENCE || process.env.AUTH0_CLIENT_ID || fallbackAudience,
  issuerBaseURL,
  tokenSigningAlg: "RS256",
});

export default jwtCheck;
