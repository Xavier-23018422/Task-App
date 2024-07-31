const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'sql.freedb.tech',
    user: 'freedb_azurey',
    password: '?afXu2*?V9%rK2X',
    database: 'freedb_c237_taskapp'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('public'));

// Middleware to parse request body
app.use(express.urlencoded({ extended: false }));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use original file name for simplicity
    }
});
const upload = multer({ storage: storage });

// Define routes

// Display all the tasks from DB
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM tasks';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving tasks');
        }
        res.render('index', { tasks: results });
    });
});

// Display specific task by ID
app.get('/task/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT * FROM tasks WHERE taskId = ?';
    connection.query(sql, [taskId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving task by ID');
        }
        if (results.length > 0) {
            res.render('task', { task: results[0] });
        } else {
            res.status(404).send('Task not found');
        }
    });
});

// Add a new task with image upload
app.get('/addTask', (req, res) => {
    res.render('addTask');
});

app.post('/addTask', upload.single('image'), (req, res) => {
    const { name, description, deadline } = req.body;
    let image = null;
    if (req.file) {
        image = req.file.filename; // Save only the filename
    }
    const sql = 'INSERT INTO tasks (taskName, description, deadline, image) VALUES (?, ?, ?, ?)';
    connection.query(sql, [name, description, deadline, image], (error, results) => {
        if (error) {
            console.error('Error adding task:', error);
            return res.status(500).send('Error adding task');
        }
        res.redirect('/');
    });
});

// Edit a task
app.get('/editTask/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT * FROM tasks WHERE taskId = ?';
    connection.query(sql, [taskId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving task by ID');
        }
        if (results.length > 0) {
            res.render('editTask', { task: results[0] });
        } else {
            res.status(404).send('Task not found');
        }
    });
});

// Updated POST route for editing a task
app.post('/editTask/:id', upload.single('image'), (req, res) => {
    const taskId = req.params.id;
    const { name, description, deadline } = req.body;
    let image = req.body.currentImage; // retrieve current image filename
    if (req.file) {
        image = req.file.filename; // set image to be new image filename
    }
    const sql = 'UPDATE tasks SET taskName = ?, description = ?, deadline = ?, image = ? WHERE taskId = ?';
    connection.query(sql, [name, description, deadline, image, taskId], (error, results) => {
        if (error) {
            console.error('Error updating task:', error);
            return res.status(500).send('Error updating task');
        }
        res.redirect('/');
    });
});

// Delete a task
app.get('/deleteTask/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = 'DELETE FROM tasks WHERE taskId = ?';
    connection.query(sql, [taskId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error deleting task');
        }
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
