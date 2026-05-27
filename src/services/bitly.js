import request from '@/utils/request';
import { getRuntimeConfig } from "@/utils/runtime-config";

export const getShortenUrl = (longUrl) => {
  const { BITLY_TOKEN } = getRuntimeConfig();
  return request.post(
    'https://api-ssl.bitly.com/v4/shorten',
    {
      long_url: longUrl,
    },
    {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${BITLY_TOKEN}`,
      },
    }
  );
};
