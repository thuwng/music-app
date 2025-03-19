const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const Song = require("../models/Song");
const FavoriteSong = require("../models/FavoriteSong");
const bcrypt = require("bcrypt");
const mm = require("music-metadata"); // Thư viện music-metadata
const fs = require("fs");
const cors = require("cors"); // Thêm CORS
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

// Thêm giới hạn kích thước (50MB)
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const acceptedFormats = ["audio/mpeg", "audio/ogg", "audio/wav"];
    if (acceptedFormats.includes(file.mimetype)) {
      console.log(
        `File accepted: ${file.originalname}, Size: ${file.size} bytes`
      );
      cb(null, true);
    } else {
      console.log(`File rejected: ${file.originalname}, Invalid format`);
      cb(new Error("Please upload an audio file in MP3, OGG, or WAV format."));
    }
  },
});

// Middleware xử lý lỗi multer
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

// Route đăng ký người dùng
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, message: "Username already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ success: true, userId: user._id });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route đăng nhập
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.json({ success: true, userId: user._id });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Hàm chuẩn hóa tiếng Việt (loại bỏ dấu và chuẩn hóa ký tự)
const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Loại bỏ dấu
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
  return str.toLowerCase().replace(/[^a-z0-9]/g, ""); // Giữ lại chữ cái và số
};

// Route lấy danh sách bài hát của user
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
        console.error("Multer error details:", {
          message: err.message,
          stack: err.stack,
          file: req.file ? req.file.originalname : "No file",
        });
        return handleMulterError(err, req, res, next);
      }
      if (!req.file) {
        console.error("No file uploaded in request");
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }
      console.log(
        `File uploaded successfully: ${req.file.originalname}, Size: ${req.file.size} bytes, Path: ${req.file.path}`
      );
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
      // Upload file âm thanh lên Cloudinary
      const audioResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video", // Dùng "video" để hỗ trợ file âm thanh
        folder: "songs",
      });
      const file_path = audioResult.secure_url; // Lưu URL từ Cloudinary

      // Trích xuất metadata từ file tạm
      console.log(`Parsing metadata for file: ${req.file.originalname}`);
      const metadata = await mm.parseFile(req.file.path, { duration: true });
      console.log("Metadata parsed successfully:", {
        common: metadata.common,
        format: metadata.format,
      });

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

      // Upload ảnh bìa lên Cloudinary nếu có
      let coverImagePath = "/assets/images/cute-otter.png"; // Thay bằng URL mặc định từ Cloudinary
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

      // Lưu thông tin bài hát vào MongoDB
      const song = new Song({
        userId,
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        file_path, // URL từ Cloudinary
        coverImagePath, // URL từ Cloudinary
        lyrics,
        duration,
        genre: genre || "Other",
      });

      await song.save();
      console.log(`Song saved successfully: ${song._id}`);

      // Xóa file tạm sau khi upload
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({ success: true, song });
    } catch (error) {
      console.error("Detailed upload error:", {
        message: error.message,
        stack: error.stack,
      });
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

// Route lấy danh sách bài hát yêu thích của user
router.get("/favorites/:userId", async (req, res) => {
  try {
    const favorites = await FavoriteSong.find({
      userId: req.params.userId,
    }).populate("songId");
    res.json(favorites.map((fav) => fav.songId || {}));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route thêm bài hát vào danh sách yêu thích
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
    console.error("Error adding favorite:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route xóa bài hát khỏi danh sách yêu thích
router.delete("/favorites/:userId/:songId", async (req, res) => {
  try {
    await FavoriteSong.deleteOne({
      userId: req.params.userId,
      songId: req.params.songId,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route tải file âm thanh
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
    console.error("Download error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route xóa bài hát khỏi cơ sở dữ liệu và danh sách yêu thích
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

    // Xóa file âm thanh trên server
    const filePath = path.join(
      __dirname,
      "../uploads",
      song.file_path.split("/").pop()
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } else {
      console.warn(`File not found on server: ${filePath}`);
    }

    // Xóa ảnh bìa nếu có
    if (
      song.coverImagePath &&
      song.coverImagePath !== "/assets/images/cute-otter.png"
    ) {
      const coverPath = path.join(__dirname, "../public", song.coverImagePath);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
        console.log(`Deleted cover image: ${coverPath}`);
      } else {
        console.warn(`Cover image not found on server: ${coverPath}`);
      }
    }

    // Xóa khỏi database
    await Song.deleteOne({ _id: songId });
    await FavoriteSong.deleteOne({ userId, songId }); // Xóa khỏi danh sách yêu thích
    res.json({ success: true, message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error deleting song:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete song. Please try again.",
    });
  }
});

module.exports = router;
