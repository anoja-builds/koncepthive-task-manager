import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import TaskForm from "../components/TaskForm";

function DashboardPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  async function fetchTasks() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/tasks");
      setTasks(response.data.tasks);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load tasks.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statistics = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "PENDING").length,
    inProgress: tasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length,
    completed: tasks.filter(
      (task) => task.status === "COMPLETED",
    ).length,
    overdue: tasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate < today && task.status !== "COMPLETED";
    }).length,
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.name || "Admin User"}</p>
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

      <TaskForm onTaskCreated={fetchTasks} />

      <section className="tasks-section">
        <div className="section-header">
          <div>
            <h2>Your Tasks</h2>
            <p>View and manage your daily tasks.</p>
          </div>

          <button type="button" onClick={fetchTasks}>
            Refresh
          </button>
        </div>

        {isLoading && <p>Loading tasks...</p>}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && tasks.length === 0 && (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>Create your first task to get started.</p>
          </div>
        )}

        {!isLoading && !error && tasks.length > 0 && (
          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.priority}</td>
                    <td>{task.status.replace("_", " ")}</td>
                    <td>
                      {new Date(task.dueDate).toLocaleDateString()}
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