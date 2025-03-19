import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import axios from "axios";

// Component Header
function Header({ searchTerm, setSearchTerm, clearSearch }) {
  return (
    <div className="navbar">
      <div className="logo">
        <img src="/assets/images/cute-otter.png" alt="Otter Logo" />
        <h2>Otter Tune</h2>
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search-btn" onClick={clearSearch}>
            X
          </button>
        )}
      </div>
      <div className="user-info">
        <span className="user-name">
          Welcome,{" "}
          <strong>
            <em>panda</em>
          </strong>
        </span>
        <img
          src="/assets/images/user-icon.jpg"
          alt="User Icon"
          className="user-icon"
        />
      </div>
    </div>
  );
}

function Player() {
  const [songs, setSongs] = useState([]);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [activeSection, setActiveSection] = useState("Library");
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const userId = localStorage.getItem("userId");

  const audioRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchSongs();
      fetchFavoriteSongs();
    } else {
      console.warn("No userId found, skipping song fetch.");
      setSongs([]);
      setFavoriteSongs([]);
    }
  }, [userId, showUpload]);

  const fetchSongs = async (term = "") => {
    try {
      if (!userId) {
        console.error("No userId found in localStorage");
        setSongs([]);
        return;
      }
      const response = await axios.get(
        `https://otter-tune.onrender.com/api/songs/${userId}`,
        {
          params: { search: term },
        }
      );
      setSongs(
        response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    } catch (error) {
      console.error("Error fetching songs:", error);
      setSongs([]);
    }
  };

  const fetchFavoriteSongs = async () => {
    try {
      if (!userId) {
        console.error("No userId found in localStorage");
        setFavoriteSongs([]);
        return;
      }
      const response = await axios.get(`/api/favorites/${userId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setFavoriteSongs(data);
    } catch (error) {
      console.error("Error fetching favorite songs:", error);
      setFavoriteSongs([]);
    }
  };

  const handleSearch = (term) => {
    fetchSongs(term);
  };

  const clearSearch = () => {
    setSearchTerm("");
    fetchSongs();
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      alert("Please select a file to upload.");
      return;
    }

    const file = files[0];
    const acceptedFormats = ["audio/mpeg", "audio/ogg", "audio/wav"];
    const maxSize = 50 * 1024 * 1024;

    if (!acceptedFormats.includes(file.type)) {
      alert("Please upload a file in MP3, OGG, or WAV format.");
      setShowUpload(false);
      return;
    }

    if (file.size > maxSize) {
      alert(`File too large. Maximum size is 50MB.`);
      setShowUpload(false);
      return;
    }

    console.log(`Uploading file: ${file.name}, Size: ${file.size} bytes`);

    if (!userId) {
      alert("Please log in to upload a song.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("genre", "Other");

    try {
      const response = await axios.post("/api/songs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });
      console.log("Upload success:", response.data);
      fetchSongs();
      fetchFavoriteSongs();
      setShowUpload(false);
      alert("Song uploaded successfully!");
    } catch (error) {
      console.error(
        "Error uploading song:",
        error.response?.data?.message || error.message
      );
      alert(
        `Failed to upload song: ${
          error.response?.data?.message ||
          error.message ||
          "Please try again or check your connection."
        }`
      );
    }
  };

  const handleFavoriteToggle = async (songId, isFavorite) => {
    try {
      if (isFavorite) {
        await axios.delete(`/api/favorites/${userId}/${songId}`);
      } else {
        await axios.post("/api/favorites", {
          userId,
          songId,
        });
      }
      fetchFavoriteSongs();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDownload = (songId) => {
    // Tạo URL để tải file trực tiếp từ route /download/:songId
    const downloadUrl = `/api/download/${songId}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = ""; // Trình duyệt sẽ tự động lấy tên file từ URL
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (songId) => {
    if (window.confirm("Are you sure you want to delete this song?")) {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          alert("User not authenticated. Please log in.");
          return;
        }
        await axios.delete(`/api/songs/${songId}`, {
          data: { userId },
        });
        fetchSongs();
        fetchFavoriteSongs();
        alert("Song deleted successfully!");
      } catch (error) {
        console.error("Error deleting song:", error);
        alert("Failed to delete song. Please try again.");
      }
    }
  };

  const handlePlay = (song) => {
    // Sử dụng trực tiếp URL từ Cloudinary (song.file_path)
    const playUrl = song.file_path;
    console.log("Playing URL:", playUrl);
    setAudioUrl(playUrl);
    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const displayedSongs = activeSection === "Liked" ? favoriteSongs : songs;

  return (
    <div>
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        clearSearch={clearSearch}
      />
      <div className="main-container">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setShowUpload={setShowUpload}
        />
        <div className="content">
          <h2>
            {activeSection === "Liked" ? "Favorite Songs" : "Uploaded Songs"}
          </h2>
          {showUpload && activeSection === "Library" && (
            <div className="upload-container">
              <input
                type="file"
                accept="audio/mpeg,audio/ogg,audio/wav"
                onChange={handleUpload}
                style={{ marginTop: "10px", marginBottom: "10px" }}
                id="upload-input"
              />
              <button onClick={() => setShowUpload(false)}>Cancel</button>
            </div>
          )}
          <div className="song-list">
            {displayedSongs.length > 0 ? (
              displayedSongs.map((song) => {
                if (!song || !song._id) {
                  console.warn("Invalid song data:", song);
                  return null;
                }
                const isFavorite = Array.isArray(favoriteSongs)
                  ? favoriteSongs.some((favSong) => favSong?._id === song._id)
                  : false;
                return (
                  <div className="song-item" key={song._id}>
                    <img
                      src={
                        song.coverImagePath &&
                        song.coverImagePath !== "/assets/images/cute-otter.png"
                          ? song.coverImagePath
                          : "/assets/images/cute-otter.png"
                      }
                      alt="Song Cover"
                      className="song-icon"
                      onError={(e) => {
                        e.target.src = "/assets/images/cute-otter.png";
                      }}
                    />
                    <div className="song-details">
                      <span className="song-title">
                        {song.title || "Unknown Title"}
                      </span>
                      <span className="song-artist">
                        {song.artist || "Unknown Artist"}
                      </span>
                      {song.duration && song.duration !== "0:00" && (
                        <span className="song-duration">{song.duration}</span>
                      )}
                    </div>
                    <button
                      className={`favorite-btn ${isFavorite ? "liked" : ""}`}
                      onClick={() => handleFavoriteToggle(song._id, isFavorite)}
                    >
                      ♥
                    </button>
                    <div className="song-item-buttons">
                      <button
                        onClick={() => handlePlay(song)}
                        className="play-btn"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => handleDownload(song._id)}
                        className="download-btn"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(song._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-message">
                {activeSection === "Liked"
                  ? "No favorite songs yet."
                  : "No songs uploaded yet."}
              </p>
            )}
          </div>
        </div>
      </div>
      {audioUrl && (
        <div className="audio-player-container">
          <div className="audio-player-content">
            <img
              src={
                currentSong?.coverImagePath &&
                currentSong.coverImagePath !== "/assets/images/cute-otter.png"
                  ? currentSong.coverImagePath
                  : "/assets/images/cute-otter.png"
              }
              alt="Song Cover"
              className="audio-player-icon"
              onError={(e) => {
                e.target.src = "/assets/images/cute-otter.png";
              }}
            />
            <div className="audio-player-details">
              <span className="audio-player-title">
                {currentSong ? currentSong.title : "Unknown Title"}
              </span>
              <span className="audio-player-artist">
                {currentSong ? currentSong.artist : "Unknown Artist"}
              </span>
            </div>
            <audio
              ref={audioRef}
              id="audio-player"
              controls
              controlsList="nodownload"
              onTimeUpdate={() => {
                // Không hiển thị thời gian, chỉ kiểm soát phát nhạc
              }}
              src={audioUrl}
              className="audio-player"
            />
            <div className="audio-player-bitrate">Let's chill!</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Player;
