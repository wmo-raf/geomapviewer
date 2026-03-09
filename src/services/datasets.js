import request from "@/utils/request";
import { getRuntimeConfig } from "@/utils/runtime-config";

const { CMS_API } = getRuntimeConfig();

export const getApiDatasets = () =>
  request.get(`${CMS_API}/datasets`).then((res) => res?.data);
