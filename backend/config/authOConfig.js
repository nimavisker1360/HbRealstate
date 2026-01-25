import { auth } from "express-oauth2-jwt-bearer";
const jwtCheck = auth({
  audience: "BxBZ7tbUCQk1y0zngWitB0k0vTdIACft",
  issuerBaseURL: "https://dev-pdz8rd3zuiwyzqzo.us.auth0.com/",
  tokenSigningAlg: "RS256",
});

export default jwtCheck;
