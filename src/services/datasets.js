import request from "@/utils/request";
import { getRuntimeConfig } from "@/utils/runtime-config";

const { NEXT_PUBLIC_CMS_API } = getRuntimeConfig();

export const getApiDatasets = () =>
  request.get(`${NEXT_PUBLIC_CMS_API}/datasets`).then((res) => res?.data);
