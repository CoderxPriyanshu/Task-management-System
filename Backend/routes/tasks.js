const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');
const router = express.Router();

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied, no token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

router.use(authMiddleware);

// Get all tasks for user
router.get('/', (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create task
router.post('/', (req, res) => {
  const { title, description, priority = 'Medium', status = 'To Do', due_date = null } = req.body;
  db.run('INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)', 
    [req.userId, title, description, priority, status, due_date], 
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const newTask = { id: this.lastID, user_id: req.userId, title, description, completed: 0, priority, status, due_date };
      req.io.emit('task_created', newTask);
      res.status(201).json(newTask);
  });
});

// Update task
router.put('/:id', (req, res) => {
  const { title, description, completed, priority, status, due_date } = req.body;
  const taskId = req.params.id;

  db.run(`UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?`,
    [title, description, completed ? 1 : 0, priority, status, due_date, taskId, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Task not found or unauthorized' });

      const updatedTask = { id: parseInt(taskId), user_id: req.userId, title, description, completed: completed ? 1 : 0, priority, status, due_date };
      req.io.emit('task_updated', updatedTask);
      res.json(updatedTask);
    }
  );
});

// Delete task
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;
  
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Task not found or unauthorized' });

    req.io.emit('task_deleted', { id: parseInt(taskId), user_id: req.userId });
    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;
