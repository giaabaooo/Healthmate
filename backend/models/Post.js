const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  tag: { type: String, default: 'Update' },
  mediaUrl: { type: String }, // Đổi thành mediaUrl
  mediaType: { type: String }, // Thêm để phân biệt ảnh/video
  location: { type: String }, // Thêm trường vị trí
  isAIPost: { type: Boolean, default: false }, // Đánh dấu bài viết của AI
  stats: {
    distance: String,
    time: String,
    pace: String
  },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Thêm tính năng Save
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);