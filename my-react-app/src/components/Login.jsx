import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import LoginPageImg from "../assets/LoginPageImg.png";

const Login = () => {
  const [username, setUsername] = useState("Testlogin");
  const [password, setPassword] = useState("Test@123");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://TBATCHAPI.somee.com/batchprinting/api/LoginUser/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        },
      );

      // Read response safely
      const text = await response.text();

      let data = {};

      try {
        data = JSON.parse(text);
      } catch {
        console.log("Server Response:", text);
      }

      console.log("Status:", response.status);
      console.log("Response:", data);

      if (response.ok) {
        // Store API token if available,
        // otherwise create a temporary one.
        localStorage.setItem("token", data.token || "TEMP_LOGIN_TOKEN");

        navigate("/home", { replace: true });
      } else {
        alert(data.message || "Invalid username or password.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <div className="logo">
          <div className="logo-icon">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h2>Utsav Badge Printing</h2>
        </div>

        <div className="login-box">
          <h1>Welcome back</h1>
          <p>Please enter your details</p>

          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="options">
            <div>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember"> Remember for 30 days</label>
            </div>

            <a href="/">Forgot password?</a>
          </div>

          <button
            className="signin-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button className="google-btn">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
              alt="Google"
            />
            Sign in with Google
          </button>

          <p className="signup-text">
            Don't have an account? <a href="/">Sign up</a>
          </p>
        </div>
      </div>

      <div className="right-panel">
        <img src={LoginPageImg} alt="Login" className="right-image" />

        <div className="overlay">
          <div className="overlay-content">
            <h1>Welcome to Utsav Badge Printing</h1>
            <p>Print event badges seamlessly.</p>
            <p>
              Manage registrations, attendees, and badge printing with ease.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
