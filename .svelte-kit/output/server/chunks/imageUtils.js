const API_BASE_URL = (typeof import.meta !== "undefined" ? "http://158.108.102.14:8001" : "") || "";
function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    if (path.includes("/uploads/") && !path.includes("/api/uploads/")) {
      return path.replace("/uploads/", "/api/uploads/");
    }
    return path;
  }
  if (path.startsWith("data:")) {
    return path;
  }
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/uploads/")) {
    cleanPath = `/api${cleanPath}`;
  }
  return `${baseUrl}${cleanPath}`;
}
export {
  API_BASE_URL as A,
  resolveImageUrl as r
};
