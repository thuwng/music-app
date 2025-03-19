import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/login", {
        username,
        password,
      });
      if (response.data.success) {
        localStorage.setItem("userId", response.data.userId);
        window.location.href = "/player";
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert("Error logging in");
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
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
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
