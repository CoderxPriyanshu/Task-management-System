import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, 
  Calendar, 
  AlertCircle, 
  ListTodo, 
  Clock, 
  CheckCircle, 
  Search, 
  LayoutGrid, 
  LayoutList, 
  Plus, 
  X, 
  LogOut,
  FolderOpen
} from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import TaskItem from './TaskItem';

const Dashboard = ({ isAuthenticated, setAuth }) => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('All Tasks'); // 'All Tasks', 'Due Today', 'High Priority', 'To Do', 'In Progress', 'Completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('list'); // 'list' or 'grid'
  
  // Priority filter dropdown on main view (All priorities, High, Medium, Low)
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  // Tab filter on main view (All, To Do, In Progress, Done)
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newStatus, setNewStatus] = useState('To Do');
  const [newDueDate, setNewDueDate] = useState('');

  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('email') || 'you@gmail.com';
  const userFullName = localStorage.getItem('fullName') || 'User';

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        } else {
          if (res.status === 401) handleLogout();
        }
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      }
    };

    if (isAuthenticated) {
      fetchTasks();

      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('task_created', (newTask) => {
        if (newTask.user_id === parseInt(userId)) {
          setTasks((prev) => [newTask, ...prev]);
        }
      });

      newSocket.on('task_updated', (updatedTask) => {
        if (updatedTask.user_id === parseInt(userId)) {
          setTasks((prev) => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        }
      });

      newSocket.on('task_deleted', (deletedData) => {
        if (deletedData.user_id === parseInt(userId)) {
          setTasks((prev) => prev.filter(t => t.id !== deletedData.id));
        }
      });

      return () => newSocket.close();
    }
  }, [isAuthenticated, token, userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    setAuth(false);
    navigate('/login');
  };

  const openAddModal = () => {
    setEditingTask(null);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('Medium');
    setNewStatus('To Do');
    setNewDueDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDesc(task.description || '');
    setNewPriority(task.priority || 'Medium');
    setNewStatus(task.status || 'To Do');
    setNewDueDate(task.due_date || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      if (editingTask) {
        // Edit task
        const nextCompleted = newStatus === 'Done' ? 1 : 0;
        await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            ...editingTask,
            title: newTitle, 
            description: newDesc,
            priority: newPriority,
            status: newStatus,
            completed: nextCompleted,
            due_date: newDueDate || null
          })
        });
      } else {
        // Create task
        await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            title: newTitle, 
            description: newDesc,
            priority: newPriority,
            status: newStatus,
            due_date: newDueDate || null
          })
        });
      }
      
      setNewTitle('');
      setNewDesc('');
      setNewPriority('Medium');
      setNewStatus('To Do');
      setNewDueDate('');
      setEditingTask(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task', err);
    }
  };

  const handleToggleComplete = async (task) => {
    const nextCompleted = !task.completed;
    const nextStatus = nextCompleted ? 'Done' : 'To Do';
    try {
      await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...task, 
          completed: nextCompleted,
          status: nextStatus
        })
      });
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Helper selectors/filters
  const getSidebarCount = (type) => {
    switch (type) {
      case 'All Tasks':
        return tasks.length;
      case 'Due Today':
        return tasks.filter(t => t.due_date && isToday(parseISO(t.due_date))).length;
      case 'High Priority':
        return tasks.filter(t => t.priority === 'High').length;
      case 'To Do':
        return tasks.filter(t => t.status === 'To Do').length;
      case 'In Progress':
        return tasks.filter(t => t.status === 'In Progress').length;
      case 'Completed':
        return tasks.filter(t => t.completed).length;
      default:
        return 0;
    }
  };

  // 1. Sidebar selection filter
  let filtered = tasks.filter(task => {
    if (activeTab === 'Due Today') {
      return task.due_date && isToday(parseISO(task.due_date));
    }
    if (activeTab === 'High Priority') {
      return task.priority === 'High';
    }
    if (activeTab === 'To Do') {
      return task.status === 'To Do';
    }
    if (activeTab === 'In Progress') {
      return task.status === 'In Progress';
    }
    if (activeTab === 'Completed') {
      return task.completed;
    }
    return true; // 'All Tasks'
  });

  // 2. Search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // 3. Priority Filter (from main area filter panel)
  if (priorityFilter !== 'All priorities') {
    filtered = filtered.filter(t => t.priority === priorityFilter);
  }

  // 4. Status Filter (from main area tabs)
  if (statusFilter !== 'All') {
    filtered = filtered.filter(t => t.status === statusFilter);
  }

  // Calculation for progress bar
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todoCount = tasks.filter(t => t.status === 'To Do').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done' || t.completed).length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Tasks</h1>
        </div>

        <div className="sidebar-user">
          <div className="avatar">
            {userFullName.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{userFullName}</div>
            <div className="user-email">{userEmail}</div>
          </div>
        </div>

        <div className="progress-section">
          <span>Progress</span>
          <span style={{ fontWeight: 'bold' }}>{completionPercentage}%</span>
        </div>

        <div className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'All Tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('All Tasks')}
          >
            <div className="nav-left">
              <Inbox size={18} className="nav-icon" />
              <span>All Tasks</span>
            </div>
            <span className="nav-count">{getSidebarCount('All Tasks')}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'Due Today' ? 'active' : ''}`}
            onClick={() => setActiveTab('Due Today')}
          >
            <div className="nav-left">
              <Calendar size={18} className="nav-icon" />
              <span>Due Today</span>
            </div>
            <span className="nav-count">{getSidebarCount('Due Today')}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'High Priority' ? 'active' : ''}`}
            onClick={() => setActiveTab('High Priority')}
          >
            <div className="nav-left">
              <AlertCircle size={18} className="nav-icon" />
              <span>High Priority</span>
            </div>
            <span className="nav-count">{getSidebarCount('High Priority')}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'To Do' ? 'active' : ''}`}
            onClick={() => setActiveTab('To Do')}
          >
            <div className="nav-left">
              <ListTodo size={18} className="nav-icon" />
              <span>To Do</span>
            </div>
            <span className="nav-count">{getSidebarCount('To Do')}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'In Progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('In Progress')}
          >
            <div className="nav-left">
              <Clock size={18} className="nav-icon" />
              <span>In Progress</span>
            </div>
            <span className="nav-count">{getSidebarCount('In Progress')}</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'Completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('Completed')}
          >
            <div className="nav-left">
              <CheckCircle size={18} className="nav-icon" />
              <span>Completed</span>
            </div>
            <span className="nav-count">{getSidebarCount('Completed')}</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sync-status">
            <span className="sync-dot"></span>
            <span>Live sync enabled</span>
          </div>
          <button className="btn-signout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="topbar">
          <div className="search-bar">
            <Search size={18} className="nav-icon" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="topbar-actions">
            <div className="view-toggles">
              <button 
                className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
                onClick={() => setViewType('list')}
              >
                <LayoutList size={16} />
              </button>
              <button 
                className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
                onClick={() => setViewType('grid')}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button className="btn btn-primary" style={{ background: '#c25e28' }} onClick={openAddModal}>
              <Plus size={16} />
              <span>Add task</span>
            </button>
          </div>
        </div>

        <div className="content-area">
          {tasks.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">
                <FolderOpen size={32} />
              </div>
              <h3>No tasks here</h3>
              <p>Add a task to get started</p>
              <button className="btn btn-primary" style={{ background: '#c25e28' }} onClick={openAddModal}>
                <Plus size={16} />
                <span>Add task</span>
              </button>
            </div>
          ) : (
            /* Main Dashboard View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Progress Summary Section */}
              <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  <span>PROGRESS</span>
                  <span>{completionPercentage}%</span>
                </div>
                {/* Horizontal Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${completionPercentage}%`, height: '100%', background: '#c25e28', transition: 'width 0.3s ease' }}></div>
                </div>
                {/* Counters Row */}
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{todoCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To Do</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{inProgressCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Progress</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{doneCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Done</div>
                  </div>
                </div>
              </div>

              {/* Toolbar filters row */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Filter Tabs */}
                <div style={{ display: 'flex', background: '#efece6', padding: '0.2rem', borderRadius: 'var(--radius-md)', gap: '0.1rem' }}>
                  {['All', 'To Do', 'In Progress', 'Done'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: statusFilter === st ? 'white' : 'var(--text-muted)',
                        background: statusFilter === st ? '#c25e28' : 'transparent',
                      }}
                    >
                      {st === 'All' ? `All (${tasks.length})` : `${st} (${tasks.filter(t => st === 'Done' ? (t.status === 'Done' || t.completed) : t.status === st).length})`}
                    </button>
                  ))}
                </div>

                {/* Priority Selector Filter */}
                <div style={{ position: 'relative' }}>
                  <select 
                    value={priorityFilter} 
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{
                      background: '#efece6',
                      border: '1px solid #d1cfc7',
                      padding: '0.4rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: 'var(--text-color)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All priorities">All priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Task Items List */}
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{activeTab}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
                </div>
                
                <div className="task-list" style={{ display: viewType === 'grid' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {filtered.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      onEdit={openEditModal}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Task Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', fontWeight: 'bold' }}>{editingTask ? 'Edit task' : 'New task'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Task title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="What needs to be done?" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    style={{ background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Description</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Add more context or notes..." 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    style={{ background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem', minHeight: '80px' }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Priority</label>
                    <select 
                      className="form-input" 
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      style={{ background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Status</label>
                    <select 
                      className="form-input" 
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Due date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{ background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" style={{ background: '#c25e28', padding: '0.75rem 1.5rem', fontWeight: '600' }}>
                  {editingTask ? 'Save changes' : 'Add task'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', fontWeight: '600' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
