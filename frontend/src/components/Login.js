// components/Login.js
import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://otter-tune.onrender.com/api/login",
        {
          username,
          password,
        }
      );
      console.log("Login response:", response.data); // Debug log
      if (response.data.success) {
        localStorage.setItem("userId", response.data.userId);
        window.location.href = "/player";
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      alert(
        "Error logging in: " + (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="login-container">
      <h1>Otter Tune</h1>
      <img
        src="/assets/images/cute-otter.png"
        alt="Otter Logo"
        className="logo"
      />
      <p>Welcome to relaxing moments with our ADORABLE OTTER!</p>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
      <a href="#" className="forgot-password">
        Forgot password?
      </a>
    </div>
  );
}

export default Login;
