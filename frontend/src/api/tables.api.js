import axiosClient from "./axiosClient";

export const getTables = (params) =>
  axiosClient.get("/admin/tables", { params });

export const getTableById = (id) => axiosClient.get(`/admin/tables/${id}`);

export const createTable = (data) => axiosClient.post("/admin/tables", data);

export const updateTable = (id, data) =>
  axiosClient.put(`/admin/tables/${id}`, data);

export const updateTableStatus = (id, status) =>
  axiosClient.patch(`/admin/tables/${id}/status`, { status });

export const deleteTable = (id) => axiosClient.delete(`/admin/tables/${id}`);

export const generateQR = (id) =>
  axiosClient.post(`/admin/tables/${id}/qr/generate`);

export const regenerateAllQRs = () => {
  return axiosClient.post("/admin/tables/qr/regenerate-all");
};
