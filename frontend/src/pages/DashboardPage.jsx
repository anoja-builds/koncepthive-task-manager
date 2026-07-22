import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import TaskForm from "../components/TaskForm";

function DashboardPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState("");
  const [sortOption, setSortOption] =
    useState("newest");

  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] =
    useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/tasks");
      setTasks(response.data.tasks);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load tasks.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  async function handleTaskSaved(_task, action) {
    setEditingTask(null);

    setNotice(
      action === "update"
        ? "Task updated successfully."
        : "Task created successfully.",
    );

    await fetchTasks();
  }

  function handleEdit(task) {
    setNotice("");
    setEditingTask(task);

    window.scrollTo({
      top: 250,
      behavior: "smooth",
    });
  }

  async function handleDelete(task) {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsDeletingId(task.id);

      await api.delete(`/tasks/${task.id}`);

      if (editingTask?.id === task.id) {
        setEditingTask(null);
      }

      setNotice("Task deleted successfully.");
      await fetchTasks();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete task.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: tasks.length,

      pending: tasks.filter(
        (task) => task.status === "PENDING",
      ).length,

      inProgress: tasks.filter(
        (task) => task.status === "IN_PROGRESS",
      ).length,

      completed: tasks.filter(
        (task) => task.status === "COMPLETED",
      ).length,

      overdue: tasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        return (
          dueDate < today &&
          task.status !== "COMPLETED"
        );
      }).length,
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    const filteredTasks = tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesStatus =
        !statusFilter ||
        task.status === statusFilter;

      const matchesPriority =
        !priorityFilter ||
        task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });

    return [...filteredTasks].sort((first, second) => {
      if (sortOption === "oldest") {
        return (
          new Date(first.createdAt) -
          new Date(second.createdAt)
        );
      }

      if (sortOption === "dueDate") {
        return (
          new Date(first.dueDate) -
          new Date(second.dueDate)
        );
      }

      return (
        new Date(second.createdAt) -
        new Date(first.createdAt)
      );
    });
  }, [
    tasks,
    searchText,
    statusFilter,
    priorityFilter,
    sortOption,
  ]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome, {user?.name || "Admin User"}
          </p>
        </div>

        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Tasks</p>
          <strong>{statistics.total}</strong>
        </article>

        <article className="stat-card">
          <p>Pending</p>
          <strong>{statistics.pending}</strong>
        </article>

        <article className="stat-card">
          <p>In Progress</p>
          <strong>{statistics.inProgress}</strong>
        </article>

        <article className="stat-card">
          <p>Completed</p>
          <strong>{statistics.completed}</strong>
        </article>

        <article className="stat-card">
          <p>Overdue</p>
          <strong>{statistics.overdue}</strong>
        </article>
      </section>

      {notice && (
        <p className="dashboard-notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <TaskForm
        editingTask={editingTask}
        onTaskSaved={handleTaskSaved}
        onCancelEdit={() => setEditingTask(null)}
      />

      <section className="tasks-section">
        <div className="section-header">
          <div>
            <h2>Your Tasks</h2>
            <p>
              Search, filter, edit, and manage your
              tasks.
            </p>
          </div>

          <button type="button" onClick={fetchTasks}>
            Refresh
          </button>
        </div>

        <div className="task-toolbar">
          <div className="toolbar-field search-field">
            <label htmlFor="task-search">
              Search by title
            </label>

            <input
              id="task-search"
              type="search"
              placeholder="Search tasks..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />
          </div>

          <div className="toolbar-field">
            <label htmlFor="status-filter">
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">
                In Progress
              </option>
              <option value="COMPLETED">
                Completed
              </option>
            </select>
          </div>

          <div className="toolbar-field">
            <label htmlFor="priority-filter">
              Priority
            </label>

            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="toolbar-field">
            <label htmlFor="task-sort">Sort by</label>

            <select
              id="task-sort"
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value)
              }
            >
              <option value="newest">
                Newest Created
              </option>
              <option value="oldest">
                Oldest Created
              </option>
              <option value="dueDate">
                Due Date
              </option>
            </select>
          </div>
        </div>

        {isLoading && <p>Loading tasks...</p>}

        {!isLoading &&
          tasks.length > 0 &&
          visibleTasks.length === 0 && (
            <div className="empty-state">
              <h3>No matching tasks</h3>
              <p>
                Change your search or filter options.
              </p>
            </div>
          )}

        {!isLoading && tasks.length === 0 && (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>
              Create your first task to get started.
            </p>
          </div>
        )}

        {!isLoading && visibleTasks.length > 0 && (
          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.priority}</td>

                    <td>
                      {task.status.replaceAll("_", " ")}
                    </td>

                    <td>
                      {new Date(
                        task.dueDate,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="edit-button"
                          type="button"
                          onClick={() => handleEdit(task)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          type="button"
                          disabled={
                            isDeletingId === task.id
                          }
                          onClick={() =>
                            handleDelete(task)
                          }
                        >
                          {isDeletingId === task.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default DashboardPage;