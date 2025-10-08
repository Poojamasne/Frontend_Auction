// src/services/apiConfig.ts
// Easily switch between production and local API endpoints here
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  // "http://localhost:5000/api"; // Local development
  "https://auction-development.onrender.com/api"; // Production
  // "https://api.easyeauction.com/api"; // Production