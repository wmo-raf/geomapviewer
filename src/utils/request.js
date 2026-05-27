import axios from "axios";
import { getRuntimeConfig } from "@/utils/runtime-config";

const { CMS_API } = getRuntimeConfig();

const isServer = typeof window === "undefined";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TIMEOUT = 50 * 1000;

export const apiRequest = axios.create({
  timeout: TIMEOUT,
  baseURL: CMS_API,
});

export const apiAuthRequest = axios.create({
  timeout: TIMEOUT,
  baseURL: CMS_API,
  headers: {
    "content-type": "application/json",
    Authorization: `Bearer ${!isServer && localStorage.getItem("userToken")}`,
  },
});

export const nominatimGeocodingRequest = axios.create({
  timeout: TIMEOUT,
  baseURL: "https://nominatim.openstreetmap.org",
});

export const gskyTimestampsRequest = axios.create({
  timeout: TIMEOUT,
  baseURL: "http://20.56.94.119/gsky/mas",
});

export const cancelToken = () => axios.CancelToken.source();

export default axios.create({
  timeout: TIMEOUT,
});
