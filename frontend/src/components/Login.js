import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';  // 👈 Import your CSS file

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            localStorage.setItem("userEmail", email);
            navigate("/");
        } else {
            alert(data.message);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Login to Your Account</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button onClick={handleLogin}>Login</button>
                <p>Don’t have an account? <a href="/signup">Sign up</a></p>
            </div>
        </div>
    );
}

export default Login;
