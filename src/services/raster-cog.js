import request from "@/utils/request";

// Fetches the TileJSON document served by the geomanager backend for a
// raster_cog layer. Shape:
//   { timestamps: ISO[], urls: { [iso: string]: cogUrl }, ... }
export const fetchTileJson = (tileJsonUrl) =>
  request(tileJsonUrl).then((res) => res?.data || {});
