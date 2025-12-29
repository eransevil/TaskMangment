import React, { useState, useEffect } from "react";
import "./App.css";
import TaskList from "./components/TaskList";
import TaskForm from "./components/TaskForm";
import { Task, User, TaskType, TaskState } from "./types";
import {
  fetchTasks,
  fetchUsers,
  createTask,
  advanceTask,
  reverseTask,
  closeTask,
} from "./api";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsersAndTasks();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadTasks(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsersAndTasks = async () => {
    try {
      setLoading(true);
      const usersData = await fetchUsers();
      setUsers(usersData);

      // Set first user as default if available
      if (usersData.length > 0) {
        setSelectedUserId(usersData[0].id);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (userId: string) => {
    try {
      setLoading(true);
      const tasksData = await fetchTasks(userId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
      alert("Failed to load tasks. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    type: TaskType;
    assigneeId: string;
    customFields?: Record<string, any>;
  }) => {
    try {
      const newTask = await createTask(taskData);
      setTasks([newTask, ...tasks]);
      setShowForm(false);
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task: " + (error as Error).message);
    }
  };

  const handleAdvance = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        alert("Task not found");
        return;
      }

      let customFields: Record<string, any> | undefined;

      // Collect required data based on task type and current UI state
      if (task.type === TaskType.PROCUREMENT) {
        if (task.state === TaskState.DRAFT) {
          // Status 1 -> 2: require quote1, quote2
          const quote1 = window.prompt("Enter first price quote (quote1):") || "";
          const quote2 = window.prompt("Enter second price quote (quote2):") || "";

          if (!quote1.trim() || !quote2.trim()) {
            alert("Both quote1 and quote2 are required to advance this procurement task.");
            return;
          }

          customFields = {
            quote1: quote1.trim(),
            quote2: quote2.trim(),
          };
        } else if (task.state === TaskState.IN_PROGRESS) {
          // Status 2 -> 3: require receipt
          const receipt = window.prompt("Enter purchase receipt identifier:") || "";
          if (!receipt.trim()) {
            alert("Receipt is required to advance this procurement task.");
            return;
          }
          customFields = { receipt: receipt.trim() };
        }
      } else if (task.type === TaskType.DEVELOPMENT) {
        if (task.state === TaskState.DRAFT) {
          // Status 1 -> 2: specification
          const specification =
            window.prompt("Enter specification text for this task:") || "";
          if (!specification.trim()) {
            alert("Specification is required to advance this development task.");
            return;
          }
          customFields = { specification: specification.trim() };
        } else if (task.state === TaskState.IN_PROGRESS) {
          // Status 2 -> 3: branch name
          const branch =
            window.prompt("Enter branch name where development was completed:") ||
            "";
          if (!branch.trim()) {
            alert("Branch name is required to advance this development task.");
            return;
          }
          customFields = { branch: branch.trim() };
        } else if (task.state === TaskState.REVIEW) {
          // Status 3 -> 4: version number
          const version =
            window.prompt("Enter version number for distribution (e.g., 1.2.3):") ||
            "";
          if (!version.trim()) {
            alert("Version is required to advance this development task.");
            return;
          }
          customFields = { version: version.trim() };
        }
      }

      const updated = await advanceTask(taskId, {
        customFields,
      });
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
    } catch (error) {
      alert("Failed to advance task: " + (error as Error).message);
    }
  };

  const handleReverse = async (taskId: string) => {
    try {
      const updated = await reverseTask(taskId);
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
    } catch (error) {
      alert("Failed to reverse task: " + (error as Error).message);
    }
  };

  const handleClose = async (taskId: string) => {
    try {
      const updated = await closeTask(taskId);
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
    } catch (error) {
      alert("Failed to close task: " + (error as Error).message);
    }
  };

  if (loading && !selectedUserId) {
    return <div className="app">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Management Platform</h1>
        <div className="user-selector">
          <label>
            View tasks for:
            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="app-content">
        <div className="actions">
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Create New Task"}
          </button>
        </div>

        {showForm && selectedUserId && (
          <TaskForm
            key="task-form"
            users={users}
            defaultUserId={selectedUserId}
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
          />
        )}

        <TaskList
          tasks={tasks}
          onAdvance={handleAdvance}
          onReverse={handleReverse}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}

export default App;
