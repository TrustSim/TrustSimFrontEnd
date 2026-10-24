export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl.replace(/\/api\/?$/i, "");
  }

  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "https://localhost:7120"
    : "http://localhost:5130";
};

