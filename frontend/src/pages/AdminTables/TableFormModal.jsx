import { useForm } from "react-hook-form";
import { useEffect } from "react";

export default function TableFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (initialData) reset(initialData);
    else
      reset({
        table_number: "",
        capacity: 2,
        location: "Indoor",
        description: "",
      });
  }, [initialData, reset, open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0 }}>
            {initialData ? "Edit Table" : "Add New Table"}
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "20px" }}>
          <div className="form-group">
            <label className="form-label">Table Number</label>
            <input
              className="form-input"
              placeholder="e.g. T-01"
              {...register("table_number", { required: true })}
            />
            {errors.table_number && (
              <span className="form-hint error">Required</span>
            )}
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Capacity</label>
              <input
                type="number"
                className="form-input"
                {...register("capacity", { required: true, min: 1, max: 20 })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Location</label>
              <select className="form-input" {...register("location")}>
                <option>Indoor</option>
                <option>Outdoor</option>
                <option>VIP</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows="3"
              {...register("description")}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Save Table
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
