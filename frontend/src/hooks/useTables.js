import { useEffect, useState, useCallback } from "react";
import {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  generateQR,
} from "../api/tables.api";

export default function useTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTables();
      // Backend trả về array trực tiếp trong res.data
      setTables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tables");
      // Nếu lỗi, đảm bảo tables vẫn là mảng rỗng
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const create = async (data) => {
    setLoading(true);
    try {
      await createTable(data);
      await fetchTables();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, data) => {
    setLoading(true);
    try {
      await updateTable(id, data);
      await fetchTables();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (table) => {
    setLoading(true);
    try {
      await updateTableStatus(
        table.id,
        table.status === "active" ? "inactive" : "active"
      );
      await fetchTables();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateQr = async (tableId) => {
    try {
      const res = await generateQR(tableId);
      return res.data.data.qrUrl;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    tables,
    loading,
    error,
    fetchTables,
    create,
    update,
    toggleStatus,
    generateQr,
  };
}
