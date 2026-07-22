import { useEffect, useState } from "react";
import api from "../api/api";

function getTodayDate() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}

function createInitialFormData() {
  return {
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: getTodayDate(),
  };
}

function TaskForm({
  editingTask,
  onTaskSaved,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState(
    createInitialFormData(),
  );

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError("");

    if (editingTask) {
      setFormData({
        title: editingTask.title || "",
        description: editingTask.description || "",
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate
          ? editingTask.dueDate.split("T")[0]
          : getTodayDate(),
      });
    } else {
      setFormData(createInitialFormData());
    }
  }, [editingTask]);

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

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate,
    };

    try {
      setIsSubmitting(true);

      let response;
      let action;

      if (editingTask) {
        response = await api.put(
          `/tasks/${editingTask.id}`,
          taskData,
        );

        action = "update";
      } else {
        response = await api.post("/tasks", taskData);
        action = "create";
      }

      setFormData(createInitialFormData());

      if (onTaskSaved) {
        await onTaskSaved(response.data.task, action);
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
          "Unable to save task.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setError("");
    setFormData(createInitialFormData());

    if (onCancelEdit) {
      onCancelEdit();
    }
  }

  return (
    <section className="task-form-section">
      <div className="task-form-heading">
        <h2>
          {editingTask ? "Edit Task" : "Create Task"}
        </h2>

        <p>
          {editingTask
            ? "Update the selected task."
            : "Add a new task to your dashboard."}
        </p>
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
          <label htmlFor="task-priority">
            Priority
          </label>

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
            <option value="COMPLETED">
              Completed
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-due-date">
            Due Date
          </label>

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
          <p
            className="error-message task-form-message"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="task-form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : editingTask
                ? "Update Task"
                : "Create Task"}
          </button>

          {editingTask && (
            <button
              className="secondary-button"
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default TaskForm;