import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

export default function SSLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/songshack");
    } catch {
      setError("Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-form-wrap">
      <h2>Login</h2>

      <div className="ss-field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="ss-field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error ? <p className="ss-error">{error}</p> : null}

      <button className="ss-btn" onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <div className="ss-link-row">
        Don't have an account? <Link to="/songshack/register">Register</Link>
      </div>
    </div>
  );
}