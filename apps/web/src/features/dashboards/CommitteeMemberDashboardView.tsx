import React, { useState } from 'react';

interface Props {
  userName?: string;
}

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

const initialTasks: TaskItem[] = [
  { id: '1', title: 'Prepare meeting report', dueDate: 'Apr 28, 2025', completed: true },
  { id: '2', title: 'Follow up on contributions', dueDate: 'Apr 27, 2025', completed: false },
  { id: '3', title: 'Update student list', dueDate: 'Apr 26, 2025', completed: false },
  { id: '4', title: 'Review welfare emergency requests', dueDate: 'May 02, 2025', completed: false },
];

export const CommitteeMemberDashboardView: React.FC<Props> = ({ userName = 'Ahmed Yusuf' }) => {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  return (
    <div className="d-flex flex-column gap-3.5">
      {/* 1. Welcome Header Banner matching screenshot */}
      <div className="dashboard-card p-3 p-md-3.5 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #1176BC 0%, #25A8E0 100%)',
              fontSize: '1.15rem',
            }}
          >
            {userName.charAt(0)}
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">Welcome, {userName}</h4>
            <div className="text-muted small">Committee Member &bull; Student Welfare &amp; Academics</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill bg-light border small text-muted">
            <i className="bi bi-calendar3 text-km-cyan"></i>
            <span className="fw-semibold text-dark">Spring 2025</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Key Stat Cards Row matching screenshot */}
      <div className="row g-3">
        {/* Tasks Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
            >
              <i className="bi bi-list-check fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">5</div>
              <div className="text-muted small mt-1">Tasks</div>
            </div>
          </div>
        </div>

        {/* Meetings Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}
            >
              <i className="bi bi-calendar-event fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">2</div>
              <div className="text-muted small mt-1">Meetings</div>
            </div>
          </div>
        </div>

        {/* Report Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(37, 168, 224, 0.12)', color: '#25A8E0' }}
            >
              <i className="bi bi-file-earmark-text fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">1</div>
              <div className="text-muted small mt-1">Report</div>
            </div>
          </div>
        </div>

        {/* On Track Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-check2-all fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">100%</div>
              <div className="text-muted small mt-1">On Track</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Tasks Card matching screenshot */}
      <div className="dashboard-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-dark">My Tasks</h6>
            <div className="text-muted small">Assigned committee responsibilities &amp; deadlines</div>
          </div>
          <a href="#view-all-tasks" className="text-km-primary text-decoration-none small fw-semibold">
            View All &rarr;
          </a>
        </div>

        <div className="d-flex flex-column gap-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-light hover-bg-light cursor-pointer transition-all"
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
                  className="form-check-input mt-0"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span className={`fw-medium small ${task.completed ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                  {task.title}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-white text-muted border small font-monospace">
                  Due: {task.dueDate}
                </span>
                {task.completed ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                    Done
                  </span>
                ) : (
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
