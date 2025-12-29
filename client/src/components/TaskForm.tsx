import React, { useState, useEffect } from "react";
import "./TaskForm.css";
import { User, TaskType } from "../types";

interface TaskFormProps {
  users: User[];
  defaultUserId: string;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    type: TaskType;
    assigneeId: string;
    customFields?: Record<string, any>;
  }) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  users,
  defaultUserId,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>(TaskType.PROCUREMENT);
  const [assigneeId, setAssigneeId] = useState(defaultUserId);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  // Sync assigneeId when defaultUserId changes
  useEffect(() => {
    setAssigneeId(defaultUserId);
  }, [defaultUserId]);

  // Reset form when component mounts or when cancelled
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType(TaskType.PROCUREMENT);
    setAssigneeId(defaultUserId);
    setCustomFields({});
  };

  useEffect(() => {
    resetForm();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      assigneeId,
      customFields:
        Object.keys(customFields).length > 0 ? customFields : undefined,
    });

    // Reset form after successful submission
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const renderCustomFields = () => {
    // Note: Status 1 (Created) has no required data for any task type.
    // All custom fields are optional during task creation.
    // Required fields will be validated when advancing to the next status.
    if (type === TaskType.PROCUREMENT) {
      return (
        <div className="form-group">
          <label>Vendor</label>
          <input
            type="text"
            value={customFields.vendor || ""}
            onChange={(e) =>
              setCustomFields({ ...customFields, vendor: e.target.value })
            }
          />
          <label>Budget </label>
          <input
            type="number"
            value={customFields.budget || ""}
            onChange={(e) =>
              setCustomFields({
                ...customFields,
                budget: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
          <label>Purchase Order Number </label>
          <input
            type="text"
            value={customFields.purchaseOrderNumber || ""}
            onChange={(e) =>
              setCustomFields({
                ...customFields,
                purchaseOrderNumber: e.target.value,
              })
            }
          />
        </div>
      );
    } else if (type === TaskType.DEVELOPMENT) {
      return (
        <div className="form-group">
          <label>Repository </label>
          <input
            type="text"
            value={customFields.repository || ""}
            onChange={(e) =>
              setCustomFields({ ...customFields, repository: e.target.value })
            }
          />
          <label>Branch </label>
          <input
            type="text"
            value={customFields.branch || ""}
            onChange={(e) =>
              setCustomFields({ ...customFields, branch: e.target.value })
            }
          />
          <label>Pull Request URL </label>
          <input
            type="url"
            placeholder="https://PullRequestUrl.com"
            value={customFields.pullRequestUrl || ""}
            onChange={(e) =>
              setCustomFields({
                ...customFields,
                pullRequestUrl: e.target.value,
              })
            }
          />
          <label>Tech Stack (comma-separated, optional)</label>
          <input
            type="text"
            value={
              Array.isArray(customFields.techStack)
                ? customFields.techStack.join(", ")
                : customFields.techStack || ""
            }
            onChange={(e) =>
              setCustomFields({
                ...customFields,
                techStack: e.target.value
                  ? e.target.value.split(",").map((s) => s.trim())
                  : undefined,
              })
            }
          />
        </div>
      );
    }
    return null;
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Type </label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TaskType);
            setCustomFields({}); // Reset custom fields when type changes
          }}
        >
          <option value={TaskType.PROCUREMENT}>Procurement</option>
          <option value={TaskType.DEVELOPMENT}>Development</option>
        </select>
      </div>

      <div className="form-group">
        <label>Assignee </label>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          required
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {renderCustomFields()}

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          Create Task
        </button>
        <button type="button" onClick={handleCancel} className="btn-cancel">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
