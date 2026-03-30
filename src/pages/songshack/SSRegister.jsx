import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { createUser, isUsernameTaken } from "../../utils/songshack/users";

export default function SSRegister() {
  const [form, setForm] = useState({
    firstName: "", surname: "", username: "",
    email: "", password: "", dob: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    setError("");

    if (Object.values(form).some((v) => !v.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 8 || !/\d/.test(form.password)) {
      setError("Password must be at least 8 characters and include a number.");
      return;
    }

    setLoading(true);
    try {
      if (await isUsernameTaken(form.username)) {
        setError("That username is already taken.");
        return;
      }

      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);

      await createUser(user.uid, {
        firstName: form.firstName.trim(),
        surname: form.surname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        dob: form.dob,
        favouriteAlbumId: null,
      });

      navigate("/songshack");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-form-wrap">
      <h2>Register</h2>

      {[
        { label: "First Name", key: "firstName", type: "text" },
        { label: "Surname", key: "surname", type: "text" },
        { label: "Username", key: "username", type: "text" },
        { label: "Email", key: "email", type: "email" },
        { label: "Password", key: "password", type: "password" },
        { label: "Date of Birth", key: "dob", type: "date" },
      ].map(({ label, key, type }) => (
        <div className="ss-field" key={key}>
          <label>{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </div>
      ))}

      {error ? <p className="ss-error">{error}</p> : null}

      <button className="ss-btn" onClick={handleRegister} disabled={loading}>
        {loading ? "Registering…" : "Register"}
      </button>

      <div className="ss-link-row">
        Already have an account? <Link to="/songshack/login">Login</Link>
      </div>
    </div>
  );
}