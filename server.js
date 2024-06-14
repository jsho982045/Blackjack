require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

// Set up SQLite connection
const db = new sqlite3.Database('blackjack_game.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database.');
    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
  }
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Registering user:', username);

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Error registering user' });
      } else {
        res.status(201).json({ user: { id: this.lastID, username } });
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// User login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Logging in user:', username);

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Error logging in:', err);
        return res.status(500).json({ error: 'Error logging in' });
      }

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      res.status(200).json({ message: 'Login successful', walletBalance: user.wallet_balance });
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.post('/update-wallet', async (req, res) => {
  const { username, newBalance } = req.body;
  db.run('UPDATE users SET wallet_balance = ? WHERE username = ?', [newBalance, username], function(err) {
      if (err) {
          console.error('Error updating wallet balance:', err);
          res.status(500).json({ error: 'Error updating wallet balance' });
      } else {
          res.status(200).json({ message: 'Wallet updated successfully' });
      }
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


