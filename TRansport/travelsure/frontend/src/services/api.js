import axios from "axios";
export const api = axios.create({ baseURL: "/api", timeout: 15000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("travelsure-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const errorMessage = (e) =>
  e.response?.data?.error ||
  e.message ||
  "Something went wrong. Please try again.";
export async function downloadDocument(id, kind) {
  const response = await api.get(`/bookings/${id}/document/${kind}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `travelsure-${kind}-${id}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
