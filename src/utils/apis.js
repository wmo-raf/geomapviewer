import { getRuntimeConfig } from "runtime-config";
const { NEXT_PUBLIC_CMS_API } = getRuntimeConfig();

export const CMS_API = NEXT_PUBLIC_CMS_API;
