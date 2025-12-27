import axiosClient from "./axiosClient";

export const menuApi = {
  // --- CATEGORIES ---
  getCategories: () => axiosClient.get("/admin/menu/categories"),
  createCategory: (data) => axiosClient.post("/admin/menu/categories", data),
  updateCategory: (id, data) =>
    axiosClient.put(`/admin/menu/categories/${id}`, data),
  toggleCategoryStatus: (id) =>
    axiosClient.patch(`/admin/menu/categories/${id}/status`),

  // --- ITEMS ---
  getItems: (params) => axiosClient.get("/admin/menu/items", { params }),
  createItem: (data) => axiosClient.post("/admin/menu/items", data),
  updateItem: (id, data) => axiosClient.put(`/admin/menu/items/${id}`, data),
  deleteItem: (id) => axiosClient.delete(`/admin/menu/items/${id}`),

  // --- MODIFIERS (Nhóm topping/size) ---
  getModifierGroups: () => axiosClient.get("/admin/menu/modifier-groups"),
  createModifierGroup: (data) =>
    axiosClient.post("/admin/menu/modifier-groups", data),
  updateModifierGroup: (id, data) =>
    axiosClient.put(`/admin/menu/modifier-groups/${id}`, data),
  deleteModifierGroup: (id) =>
    axiosClient.delete(`/admin/menu/modifier-groups/${id}`),
  addOptionToGroup: (groupId, data) =>
    axiosClient.post(`/admin/menu/modifier-groups/${groupId}/options`),
  updateModifierOption: (optionId, data) =>
    axiosClient.put(`/admin/menu/modifier-options/${optionId}`, data),
  deleteModifierOption: (optionId) =>
    axiosClient.delete(`/admin/menu/modifier-options/${optionId}`),
  attachModifierGroupsToItem: (itemId, groupIds) =>
    axiosClient.post(`/admin/menu/items/${itemId}/modifier-groups`, {
      groupIds,
    }),
};
