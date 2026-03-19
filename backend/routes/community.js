const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const cron = require('node-cron');
const Group = require('../models/Group');

// --- CẤU HÌNH CLOUDINARY & MULTER ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillmatch_videos', 
    allowedFormats: ['jpg', 'png', 'jpeg', 'mp4', 'webm', 'mov'],
    resource_type: 'auto' 
  }
});

const upload = multer({ storage });

// --- AI AUTO POST (Chạy lúc 8:00 sáng và 20:00 tối mỗi ngày) ---
cron.schedule('0 8,20 * * *', async () => {
  try {
    const aiUser = await User.findOne({ 'profile.full_name': 'HealthMate AI Coach' }); 
    if (aiUser) {
      const newPost = new Post({
        content: "🔥 Lời khuyên từ AI: Hãy nhớ uống đủ 2 lít nước và dành ra 30 phút vận động hôm nay nhé!",
        user: aiUser._id,
        tag: 'AI Coach',
        isAIPost: true, // ĐÁNH DẤU BÀI CỦA AI
        createdAt: new Date()
      });
      const savedPost = await newPost.save();
      const populatedPost = await Post.findById(savedPost._id).populate('user', 'profile.full_name profile.picture');
      
      // An toàn với socket
      if (global.io) global.io.emit('new_post', populatedPost);
    }
  } catch (err) { console.error("AI Post Error:", err); }
});

// 1. Lấy Feed
router.get('/posts', async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = {};
    
    if (groupId) {
      query.groupId = groupId; // Lấy bài trong Group cụ thể
    } else {
      query.groupId = { $in: [null, undefined] }; // Lấy bài Global (không thuộc Group nào)
    }

    const posts = await Post.find(query)
      .populate('user', 'profile.full_name profile.picture')
      .populate('comments.user', 'profile.full_name profile.picture')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json(err); }
});

// 2. Lấy Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({}, 'profile.full_name profile.picture daily_routine');
    const leaderboard = users
      .map(user => ({
        name: user.profile?.full_name || 'Unknown',
        picture: user.profile?.picture,
        totalExercises: user.daily_routine?.reduce((acc, curr) => acc + (curr.exercises?.length || 0), 0) || 0
      }))
      .filter(user => user.totalExercises > 0)
      .sort((a, b) => b.totalExercises - a.totalExercises)
      .slice(0, 10);
    res.json(leaderboard);
  } catch (err) { res.status(500).json(err); }
});

// 3. Like bài viết
router.put('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id; 
    
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'profile.full_name profile.picture')
      .populate('comments.user', 'profile.full_name profile.picture');
    
    // FIX EMIT LỖI
    const io = req.app.get('socketio') || global.io;
    if (io) io.emit('post_updated', updatedPost); 
    
    res.json(updatedPost);
  } catch (err) { res.status(500).json(err); }
});

// 4. Comment bài viết
router.post('/posts/:id/comment', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: req.user.id,
      text: req.body.text,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'profile.full_name profile.picture')
      .populate('comments.user', 'profile.full_name profile.picture');

    // FIX EMIT LỖI
    const io = req.app.get('socketio') || global.io;
    if (io) io.emit('post_updated', updatedPost); 
    
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Đăng bài viết (Hỗ trợ upload File qua Cloudinary)
router.post('/posts', protect, upload.single('media'), async (req, res) => {
  try {
    const newPost = new Post({
      content: req.body.content || '',
      user: req.user.id,
      tag: req.body.tag || 'Update',
      location: req.body.location || '',
      mediaUrl: req.file ? req.file.path : '',
      mediaType: req.file ? req.file.mimetype : '',
      groupId: req.body.groupId || null, // BỔ SUNG DÒNG NÀY
      createdAt: new Date()
    });
    
    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id)
      .populate('user', 'profile.full_name profile.picture')
      .populate('comments.user', 'profile.full_name profile.picture');
    
    // FIX EMIT LỖI
    const io = req.app.get('socketio') || global.io;
    if (io) io.emit('new_post', populatedPost); 
    
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Save bài viết
router.put('/posts/:id/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id; 
    
    // Đảm bảo savedBy là một mảng (tránh lỗi với các bài viết cũ)
    if (!post.savedBy) {
      post.savedBy = [];
    }

    if (post.savedBy.includes(userId)) {
      post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
    } else {
      post.savedBy.push(userId);
    }
    
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'profile.full_name profile.picture')
      .populate('comments.user', 'profile.full_name profile.picture');
    
    // FIX EMIT LỖI
    const io = req.app.get('socketio') || global.io;
    if (io) io.emit('post_updated', updatedPost); 
    
    res.json(updatedPost);
  } catch (err) { 
    console.error("Lỗi API Save:", err);
    res.status(500).json({ message: err.message }); 
  }
});
// Lấy danh sách tất cả các nhóm
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find().populate('admin', 'profile.full_name profile.picture');
    res.json(groups);
  } catch (err) { res.status(500).json(err); }
});

// Lấy thông tin 1 nhóm cụ thể
router.get('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('admin members', 'profile.full_name profile.picture');
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) { res.status(500).json(err); }
});

// Tạo nhóm mới
router.post('/groups', protect, async (req, res) => {
  try {
    const newGroup = new Group({
      name: req.body.name,
      description: req.body.description,
      admin: req.user.id,
      members: [req.user.id] // Admin mặc định là thành viên đầu tiên
    });
    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) { res.status(500).json(err); }
});

// Tham gia / Rời khỏi nhóm
router.put('/groups/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userId = req.user.id;
    if (group.members.includes(userId)) {
      // Đã tham gia -> Rời nhóm
      group.members = group.members.filter(id => id.toString() !== userId);
    } else {
      // Chưa tham gia -> Tham gia
      group.members.push(userId);
    }
    
    await group.save();
    res.json(group);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;