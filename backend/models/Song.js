const mongoose = require("mongoose");

// Định nghĩa schema cho bài hát
const songSchema = new mongoose.Schema(
  {
    // ID người dùng sở hữu bài hát (bắt buộc, tham chiếu đến model User)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Tiêu đề bài hát (không bắt buộc, có giá trị mặc định)
    title: {
      type: String,
      default: "Unknown Title", // Giá trị mặc định nếu không có tiêu đề
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Tên nghệ sĩ (không bắt buộc, có giá trị mặc định)
    artist: {
      type: String,
      default: "Unknown Artist", // Giá trị mặc định nếu không có nghệ sĩ
      trim: true,
      maxlength: [100, "Artist name cannot exceed 100 characters"],
    },

    // Tên album (không bắt buộc, có giá trị mặc định)
    album: {
      type: String,
      default: "Unknown Album", // Giá trị mặc định nếu không có album
      trim: true,
      maxlength: [100, "Album name cannot exceed 100 characters"],
    },

    // Đường dẫn file âm thanh (bắt buộc)
    file_path: {
      type: String,
      required: [true, "File path is required"],
      unique: true, // Đảm bảo không trùng đường dẫn
    },

    // Đường dẫn hình ảnh bìa (tùy chọn, có giá trị mặc định)
    coverImagePath: {
      type: String,
      default: "/assets/images/cute-otter.png", // Ảnh mặc định nếu không có hình ảnh
    },

    // Lời bài hát (tùy chọn, có giá trị mặc định)
    lyrics: {
      type: String,
      default: "No lyrics available", // Mặc định nếu không có lời
      trim: true,
    },

    // Thời lượng bài hát (tùy chọn, định dạng MM:SS)
    duration: {
      type: String, // Thay đổi từ Number thành String để lưu định dạng MM:SS
      default: "0:00", // Mặc định 0:00 nếu không xác định
    },

    // Thể loại âm nhạc (tùy chọn)
    genre: {
      type: String,
      enum: [
        "Pop",
        "Rock",
        "Hip Hop",
        "Electronic",
        "Classical",
        "Jazz",
        "Other",
      ],
      default: "Other",
    },

    titleNoAccent: { type: String }, // Thêm trường không dấu cho title
    artistNoAccent: { type: String }, // Thêm trường không dấu cho artist

    // Thời gian tạo (tự động thêm khi tạo mới)
    createdAt: {
      type: Date,
      default: Date.now,
    },

    // Thời gian cập nhật (tự động cập nhật khi sửa)
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Tự động quản lý createdAt và updatedAt
  }
);

// Thêm index để tối ưu hóa truy vấn
songSchema.index({ userId: 1, createdAt: -1 }); // Index cho userId và sắp xếp theo createdAt giảm dần
songSchema.index({ title: "text", artist: "text" }); // Index text search cho title và artist

// Middleware để tự động cập nhật updatedAt trước khi save
songSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Tạo model từ schema
module.exports = mongoose.model("Song", songSchema);
