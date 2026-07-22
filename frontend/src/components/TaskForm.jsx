import { useState } from "react";
import api from "../api/api";

function getTodayDate() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}

const initialFormData = {
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "PENDING",
  dueDate: getTodayDate(),
};

function TaskForm({ onTaskCreated }) {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!formData.title.trim()) {
      return "Task title is required.";
    }

    if (!formData.priority) {
      return "Priority is required.";
    }

    if (!formData.status) {
      return "Status is required.";
    }

    if (!formData.dueDate) {
      return "Due date is required.";
    }

    if (formData.dueDate < getTodayDate()) {
      return "Due date cannot be earlier than today.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.post("/tasks", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
      });

      setFormData({
        ...initialFormData,
        dueDate: getTodayDate(),
      });

      setSuccessMessage("Task created successfully.");

      if (onTaskCreated) {
        await onTaskCreated(response.data.task);
      }
    } catch (requestError) {
      const backendErrors =
        requestError.response?.data?.errors;

      const firstBackendError =
        backendErrors &&
        Object.values(backendErrors).flat()[0];

      setError(
        firstBackendError ||
          requestError.response?.data?.message ||
          "Unable to create task.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="task-form-section">
      <div className="task-form-heading">
        <h2>Create Task</h2>
        <p>Add a new task to your dashboard.</p>
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-group task-title-field">
          <label htmlFor="task-title">Title</label>

          <input
            id="task-title"
            name="title"
            type="text"
            placeholder="Enter task title"
            value={formData.title}
            onChange={handleChange}
            maxLength={150}
          />
        </div>

        <div className="form-group task-description-field">
          <label htmlFor="task-description">
            Description
          </label>

          <textarea
            id="task-description"
            name="description"
            placeholder="Enter an optional description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-priority">Priority</label>

          <select
            id="task-priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-status">Status</label>

          <select
            id="task-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">
              In Progress
            </option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-due-date">Due Date</label>

          <input
            id="task-due-date"
            name="dueDate"
            type="date"
            min={getTodayDate()}
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>

        {error && (
          <p className="error-message task-form-message" role="alert">
            {error}
          </p>
        )}

        {successMessage && (
          <p
            className="success-message task-form-message"
            role="status"
          >
            {successMessage}
          </p>
        )}

        <div className="task-form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default TaskForm;