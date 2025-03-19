// components/Sidebar.js
import React from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ activeSection, setActiveSection, setShowUpload }) {
  const navigate = useNavigate();

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  const handleUploadClick = () => {
    setActiveSection("Library");
    setShowUpload(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId"); // Clear userId
    navigate("/"); // Redirect to login page
  };

  return (
    <div className="sidebar">
      <h3>Your Space</h3>
      <ul>
        <li
          className={activeSection === "Library" ? "active" : ""}
          onClick={() => handleSectionClick("Library")}
        >
          <span className="icon" style={{ color: "yellow" }}>
            🎵
          </span>
          Library
        </li>
        <li
          className={activeSection === "Liked" ? "active" : ""}
          onClick={() => handleSectionClick("Liked")}
        >
          <span className="icon" style={{ color: "red" }}>
            ♥️
          </span>
          Liked
        </li>
        <li>
          <button
            className="upload-btn"
            onClick={handleUploadClick}
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "5px 10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Upload
          </button>
        </li>
        <li>
          <button
            className="logout-btn"
            onClick={handleLogout}
            style={{
              backgroundColor: "gray",
              color: "white",
              padding: "5px 10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
