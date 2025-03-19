const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const apiRoutes = require("./routes/api.js");
const timeout = require("connect-timeout");

// Load biến môi trường từ file .env
dotenv.config();

const fs = require("fs");

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"));
}

// Khởi tạo ứng dụng Express
const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Cho phép truy cập từ bất kỳ đâu (Render URL)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/assets/images",
  express.static(path.join(__dirname, "public/assets/images"))
);

// Áp dụng timeout cho tất cả các route (10 phút)
app.use(timeout("600s"));

// Xử lý khi timeout xảy ra
app.use((req, res, next) => {
  if (req.timedout) {
    console.error(`Request timed out for ${req.method} ${req.url}`);
    return res.status(408).json({
      success: false,
      message:
        "Request timed out. Please try again with a smaller file or check your connection.",
    });
  }
  next();
});

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error("Global error handler:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    success: false,
    message: "Internal server error. Please contact support.",
  });
});

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use("/api", apiRoutes);

// Phục vụ file tĩnh từ frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Route mặc định cho frontend (React SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// Khởi động server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cấu hình timeout cho server
server.timeout = 600000;

// Xử lý lỗi khi server không khởi động được
server.on("error", (err) => {
  console.error("Server error:", err);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});
