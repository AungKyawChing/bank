// frontend/script.js

// Helper function for making API calls
async function apiCall(endpoint, data) {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return await response.json();
}

// Register form submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const pin = document.getElementById('pin').value;

        try {
            const result = await apiCall('/register', { username, password, pin });
            document.getElementById('message').textContent = result.message;
        } catch (error) {
            document.getElementById('message').textContent = 'An error occurred. Please try again.';
        }
    });
}

// Login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const pin = document.getElementById('pin').value;

        try {
            const result = await apiCall('/login', { username, password, pin });
            if (result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('userId', result.userId);
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('message').textContent = result.message;
            }
        } catch (error) {
            document.getElementById('message').textContent = 'An error occurred. Please try again.';
        }
    });
}

// Dashboard functionality
if (window.location.pathname.includes('dashboard.html')) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }

    // Implement transfer functionality
    const transferForm = document.getElementById('transferForm');
    transferForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const recipient = document.getElementById('recipient').value;
        const amount = parseFloat(document.getElementById('amount').value);

        try {
            const result = await apiCall('/transfer', { token, recipientUsername: recipient, amount });
            document.getElementById('message').textContent = result.message;
            if (result.newBalance !== undefined) {
                document.getElementById('balance').textContent = result.newBalance;
            }
        } catch (error) {
            document.getElementById('message').textContent = 'An error occurred. Please try again.';
        }
    });

    // Implement logout functionality
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
    });
}
