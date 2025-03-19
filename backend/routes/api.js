// routes/api.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const Song = require("../models/Song");
const FavoriteSong = require("../models/FavoriteSong");
const mm = require("music-metadata");
const fs = require("fs");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "https://otter-tune.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const acceptedFormats = ["audio/mpeg", "audio/ogg", "audio/wav"];
    if (acceptedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Please upload an audio file in MP3, OGG, or WAV format."));
    }
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is 50MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Multer error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next(err);
};

// Route đăng nhập (Simplified: No bcrypt, plain-text password comparison)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    // Compare plain-text passwords
    if (password === user.password) {
      res.json({ success: true, userId: user._id });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Hàm chuẩn hóa tiếng Việt (unchanged)
const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A")
    .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E")
    .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I")
    .replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O")
    .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U")
    .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Other routes (unchanged)
router.get("/songs/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { search } = req.query;
    let query = { userId };
    if (search) {
      const normalizedSearch = removeVietnameseTones(search);
      query.$or = [
        { title: { $regex: normalizedSearch, $options: "i" } },
        { artist: { $regex: normalizedSearch, $options: "i" } },
      ];
    }
    const songs = await Song.find(query).sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(
  "/songs",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }
      next();
    });
  },
  async (req, res) => {
    const { userId, title, artist, album, genre } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    try {
      const audioResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video",
        folder: "songs",
      });
      const file_path = audioResult.secure_url;
      const metadata = await mm.parseFile(req.file.path, { duration: true });
      const songTitle =
        title ||
        (metadata.common.title
          ? metadata.common.title.trim()
          : req.file.originalname.replace(/\.[^/.]+$/, ""));
      const songArtist =
        artist ||
        (metadata.common.artist
          ? metadata.common.artist.trim()
          : "Unknown Artist");
      const songAlbum =
        album ||
        (metadata.common.album
          ? metadata.common.album.trim()
          : "Unknown Album");
      let duration = "0:00";
      if (metadata.format.duration) {
        const durationInSeconds = metadata.format.duration;
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        duration = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
      }
      let coverImagePath = "/assets/images/cute-otter.png";
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        const imageBuffer = picture.data;
        const imageResult = await cloudinary.uploader.upload(
          `data:${picture.format};base64,${imageBuffer.toString("base64")}`,
          {
            folder: "song_covers",
          }
        );
        coverImagePath = imageResult.secure_url;
      }
      let lyrics = "No lyrics available";
      if (metadata.common.lyrics && metadata.common.lyrics.length > 0) {
        lyrics = metadata.common.lyrics[0].text || "No lyrics available";
      }
      const song = new Song({
        userId,
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        file_path,
        coverImagePath,
        lyrics,
        duration,
        genre: genre || "Other",
      });
      await song.save();
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.json({ success: true, song });
    } catch (error) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: `Failed to upload song: ${error.message}`,
      });
    }
  }
);

router.get("/favorites/:userId", async (req, res) => {
  try {
    const favorites = await FavoriteSong.find({
      userId: req.params.userId,
    }).populate("songId");
    res.json(favorites.map((fav) => fav.songId || {}));
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/favorites", async (req, res) => {
  const { userId, songId } = req.body;
  try {
    const existingFavorite = await FavoriteSong.findOne({ userId, songId });
    if (existingFavorite) {
      return res
        .status(400)
        .json({ success: false, message: "Song already in favorites" });
    }
    const favorite = new FavoriteSong({ userId, songId });
    await favorite.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/favorites/:userId/:songId", async (req, res) => {
  try {
    await FavoriteSong.deleteOne({
      userId: req.params.userId,
      songId: req.params.songId,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/download/:songId", async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    if (!song) {
      return res
        .status(404)
        .json({ success: false, message: "Song not found" });
    }
    res.json({ success: true, url: song.file_path });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/songs/:songId", async (req, res) => {
  try {
    const songId = req.params.songId;
    const userId = req.body.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    const song = await Song.findOne({ _id: songId, userId });
    if (!song) {
      return res
        .status(404)
        .json({ success: false, message: "Song not found or unauthorized" });
    }
    await Song.deleteOne({ _id: songId });
    await FavoriteSong.deleteOne({ userId, songId });
    res.json({ success: true, message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete song. Please try again.",
    });
  }
});

module.exports = router;
