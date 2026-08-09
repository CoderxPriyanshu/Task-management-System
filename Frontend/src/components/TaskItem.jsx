import React, { useState } from 'react';
import { Circle, CheckCircle2, Calendar, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const TaskItem = ({ task, onToggleComplete, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !task.completed;

  const handleDeleteClick = () => {
    setShowMenu(false);
    if (window.confirm("Are you sure you want to delete this task?")) {
      onDelete(task.id);
    }
  };

  const handleEditClick = () => {
    setShowMenu(false);
    onEdit(task);
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-checkbox" onClick={() => onToggleComplete(task)}>
        {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      </div>
      
      <div className="task-details">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        
        <div className="task-meta">
          <div className={`badge priority priority-${task.priority}`}>
            <span className="priority-dot"></span>
            {task.priority}
          </div>
          
          <div className="badge status">
            {task.status}
          </div>
          
          {task.due_date && (
            <div className={`badge due-date ${isOverdue ? 'overdue' : ''}`}>
              <Calendar size={14} />
              {isOverdue ? 'Overdue · ' : ''}
              {format(parseISO(task.due_date), 'MMM d')}
            </div>
          )}
        </div>
      </div>
      
      <div className="task-actions" style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>
          <MoreHorizontal size={20} />
        </button>
        
        {showMenu && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            background: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            minWidth: '120px',
            padding: '0.25rem 0'
          }}>
            <button 
              onClick={handleEditClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--text-color)',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button 
              onClick={handleDeleteClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--danger-color)',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
