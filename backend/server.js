// backend/server.js

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

const PORT = 3000;

// Helper functions
function readJSONFile(filename) {
  return JSON.parse(fs.readFileSync(`../database/${filename}`, 'utf8'));
}

function writeJSONFile(filename, data) {
  fs.writeFileSync(`../database/${filename}`, JSON.stringify(data, null, 2));
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = JSON.parse(body);

      if (path === '/register') {
        handleRegister(data, res);
      } else if (path === '/login') {
        handleLogin(data, res);
      } else if (path === '/transfer') {
        handleTransfer(data, res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Not Found' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

function handleRegister(data, res) {
  const users = readJSONFile('users.json');
  
  if (users.some(user => user.username === data.username)) {
    res.writeHead(400);
    res.end(JSON.stringify({ message: 'Username already exists. Please try another username.' }));
    return;
  }

  const newUser = {
    id: users.length + 1,
    username: data.username,
    password: data.password,
    pin: data.pin,
    registrationTime: Math.floor(Date.now() / 1000),
    balance: 0
  };

  users.push(newUser);
  writeJSONFile('users.json', users);

  res.writeHead(200);
  res.end(JSON.stringify({ message: 'Registered successfully!' }));
}

function handleLogin(data, res) {
  const users = readJSONFile('users.json');
  const user = users.find(u => u.username === data.username && u.password === data.password && u.pin === data.pin);

  if (!user) {
    res.writeHead(400);
    res.end(JSON.stringify({ message: 'Account details don\'t match' }));
    return;
  }

  const token = generateToken();
  const expirationTime = Math.floor(Date.now() / 1000) + 4 * 60 * 60; // 4 hours

  // Store token (in memory for simplicity, but should be stored securely in a real application)
  if (!global.tokens) global.tokens = {};
  global.tokens[token] = { userId: user.id, expirationTime };

  // Log user activity
  const userActivity = readJSONFile('user_activity.json');
  userActivity.push({
    username: user.username,
    loginTime: Math.floor(Date.now() / 1000)
  });
  writeJSONFile('user_activity.json', userActivity);

  res.writeHead(200);
  res.end(JSON.stringify({ token, userId: user.id }));
}

function handleTransfer(data, res) {
  const { token, recipientUsername, amount } = data;

  if (!global.tokens || !global.tokens[token] || global.tokens[token].expirationTime < Math.floor(Date.now() / 1000)) {
    res.writeHead(401);
    res.end(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }

  const users = readJSONFile('users.json');
  const sender = users.find(u => u.id === global.tokens[token].userId);
  const recipient = users.find(u => u.username === recipientUsername);

  if (!recipient) {
    res.writeHead(400);
    res.end(JSON.stringify({ message: 'Recipient not found' }));
    return;
  }

  if (sender.balance < amount) {
    res.writeHead(400);
    res.end(JSON.stringify({ message: 'Insufficient funds' }));
    return;
  }

  sender.balance -= amount;
  recipient.balance += amount;

  writeJSONFile('users.json', users);

  const transactions = readJSONFile('transactions.json');
  const transactionTime = Math.floor(Date.now() / 1000);

  transactions.push({
    time: transactionTime,
    type: 'send',
    amount,
    balance: sender.balance,
    username: sender.username
  });

  transactions.push({
    time: transactionTime,
    type: 'received',
    amount,
    balance: recipient.balance,
    username: recipient.username
  });

  writeJSONFile('transactions.json', transactions);

  res.writeHead(200);
  res.end(JSON.stringify({ message: 'Transfer successful', newBalance: sender.balance }));
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
