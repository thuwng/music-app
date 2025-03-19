const mongoose = require("mongoose");
const Song = require("./models/Song");

// Kết nối tới MongoDB (thay YOUR_MONGODB_URI bằng chuỗi kết nối của bạn)
const MONGODB_URI = "mongodb://localhost:27017/otter_tune"; // Thay bằng URI của bạn

// Hàm chuẩn hóa tiếng Việt (đã sao chép từ api.js)
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

async function updateSongs() {
  try {
    // Kết nối tới MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Lấy tất cả các bài hát
    const songs = await Song.find();
    console.log(`Found ${songs.length} songs to update`);

    // Cập nhật từng bài hát
    for (const song of songs) {
      song.titleNoAccent = removeVietnameseTones(song.title);
      song.artistNoAccent = removeVietnameseTones(song.artist);
      await song.save();
      console.log(`Updated song: ${song.title}`);
    }

    console.log("All songs updated successfully.");
  } catch (error) {
    console.error("Error updating songs:", error);
  } finally {
    // Đóng kết nối
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

updateSongs().catch(console.error);
