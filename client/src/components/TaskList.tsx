import React from "react";
import "./TaskList.css";
import { Task, TaskState } from "../types";

interface TaskListProps {
  tasks: Task[];
  onAdvance: (taskId: string) => void;
  onReverse: (taskId: string) => void;
  onClose: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAdvance,
  onReverse,
  onClose,
}) => {
  const getStateColor = (state: TaskState): string => {
    const colors: Record<TaskState, string> = {
      [TaskState.DRAFT]: "#6c757d",
      [TaskState.IN_PROGRESS]: "#007bff",
      [TaskState.REVIEW]: "#ffc107",
      [TaskState.COMPLETED]: "#28a745",
      [TaskState.CLOSED]: "#dc3545",
    };
    return colors[state] || "#6c757d";
  };

  const formatState = (state: TaskState): string => {
    return state
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const canAdvance = (state: TaskState): boolean => {
    return state !== TaskState.CLOSED && state !== TaskState.COMPLETED;
  };

  const canReverse = (state: TaskState): boolean => {
    return state !== TaskState.DRAFT && state !== TaskState.CLOSED;
  };

  const canClose = (state: TaskState): boolean => {
    // Only allow closing from the final status (COMPLETED)
    return state === TaskState.COMPLETED;
  };

  if (tasks.length === 0) {
    return <div className="task-list-empty">No tasks found.</div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className="task-card">
          <div className="task-header">
            <h3 className="task-title">{task.title}</h3>
            <span
              className="task-state"
              style={{ backgroundColor: getStateColor(task.state) }}
            >
              {formatState(task.state)}
            </span>
          </div>

          <div className="task-meta">
            <span className="task-type">{task.type.toUpperCase()}</span>
            <span className="task-assignee">
              Assigned to: {task.assignee.name}
            </span>
          </div>

          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {task.customFields && (
            <div className="task-custom-fields">
              <strong>Custom Fields:</strong>
              <ul>
                {Object.entries(task.customFields).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong>{" "}
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="task-actions">
            {canAdvance(task.state) && (
              <button
                className="btn-advance"
                onClick={() => onAdvance(task.id)}
              >
                Advance
              </button>
            )}
            {canReverse(task.state) && (
              <button
                className="btn-reverse"
                onClick={() => onReverse(task.id)}
              >
                Reverse
              </button>
            )}
            {canClose(task.state) && (
              <button className="btn-close" onClick={() => onClose(task.id)}>
                Close
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
