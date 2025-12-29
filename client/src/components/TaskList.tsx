import React from "react";
import "./TaskList.css";
import { Task, TaskState, TaskType } from "../types";

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

  /**
   * Get status-specific field labels for better display
   */
  const getFieldLabel = (key: string, type: TaskType): string => {
    const fieldLabels: Record<string, Record<string, string>> = {
      [TaskType.PROCUREMENT]: {
        vendor: "Vendor",
        budget: "Budget",
        purchaseOrderNumber: "Purchase Order Number",
        quote1: "Quote 1 (Status 2)",
        quote2: "Quote 2 (Status 2)",
        receipt: "Receipt (Status 3)",
      },
      [TaskType.DEVELOPMENT]: {
        repository: "Repository",
        branch: "Branch (Status 3)",
        pullRequestUrl: "Pull Request URL",
        techStack: "Tech Stack",
        specification: "Specification (Status 2)",
        version: "Version (Status 4)",
      },
    };
    return fieldLabels[type]?.[key] || key;
  };

  /**
   * Determine if a field is from a previous status (read-only context)
   */
  const isHistoricalField = (
    key: string,
    type: TaskType,
    currentState: TaskState
  ): boolean => {
    // Status-specific fields that are from previous stages
    const statusFields: Record<string, Record<string, number[]>> = {
      [TaskType.PROCUREMENT]: {
        quote1: [2],
        quote2: [2],
        receipt: [3],
      },
      [TaskType.DEVELOPMENT]: {
        specification: [2],
        branch: [3],
        version: [4],
      },
    };

    const fieldStatuses = statusFields[type]?.[key];
    if (!fieldStatuses) return false;

    // Map TaskState to approximate status for comparison
    const stateToStatus: Record<TaskState, number> = {
      [TaskState.DRAFT]: 1,
      [TaskState.IN_PROGRESS]: 2,
      [TaskState.REVIEW]: 3,
      [TaskState.COMPLETED]: type === TaskType.PROCUREMENT ? 3 : 4,
      [TaskState.CLOSED]: type === TaskType.PROCUREMENT ? 3 : 4,
    };

    const currentStatus = stateToStatus[currentState];
    // Field is historical if it's from a status lower than current
    return fieldStatuses.some((status) => status < currentStatus);
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

          {task.customFields && Object.keys(task.customFields).length > 0 && (
            <div className="task-custom-fields">
              <strong>Task Data (Complete Audit Trail):</strong>
              <ul>
                {Object.entries(task.customFields).map(([key, value]) => {
                  const isHistorical = isHistoricalField(
                    key,
                    task.type,
                    task.state
                  );
                  const label = getFieldLabel(key, task.type);
                  return (
                    <li key={key} style={{ opacity: isHistorical ? 0.7 : 1 }}>
                      <strong>{label}:</strong>{" "}
                      <span
                        style={{
                          fontStyle: isHistorical ? "italic" : "normal",
                        }}
                      >
                        {Array.isArray(value)
                          ? value.join(", ")
                          : String(value)}
                        {isHistorical && (
                          <span
                            style={{
                              fontSize: "0.85em",
                              color: "#6c757d",
                              marginLeft: "8px",
                            }}
                          >
                            (from previous status)
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
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
