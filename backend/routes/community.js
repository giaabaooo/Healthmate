const router = require('express').Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');
const cron = require('node-cron');

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
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webm', 'mov'],
    resource_type: 'auto' 
  }
});
const upload = multer({ storage });

let Challenge;
try { Challenge = mongoose.model('Challenge'); } 
catch (error) {
  const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    target: { type: Number, required: true },
    metric: { type: String, required: true }, 
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPrivate: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now }
  });
  Challenge = mongoose.model('Challenge', challengeSchema);
}

cron.schedule('0 8,20 * * *', async () => {
  try {
    const aiUser = await User.findOne({ 'profile.full_name': 'HealthMate AI Coach' }); 
    if (aiUser) {
      const newPost = new Post({
        content: "🔥 Lời khuyên từ AI: Hãy nhớ uống đủ 2 lít nước và dành ra 30 phút vận động hôm nay nhé!",
        user: aiUser._id,
        tag: 'AI Coach',
        isAIPost: true, 
        createdAt: new Date()
      });
      await newPost.save();
      const populatedPost = await Post.findById(newPost._id).populate('user', 'profile.full_name profile.picture');
      if (global.io) global.io.emit('new_post', populatedPost);
    }
  } catch (err) { console.error("AI Post Error:", err); }
});

router.get('/posts', async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = {};
    if (groupId) query.groupId = groupId; 
    else query.groupId = { $in: [null, undefined] }; 

    let posts = await Post.find(query)
      .populate('user', 'profile.full_name profile.picture')
      .populate('comments.user', 'profile.full_name profile.picture')
      .sort({ createdAt: -1 });

    if (!groupId) {
        const hasAIPost = posts.some(p => p.isAIPost || p.tag === 'AI Coach');
        if (!hasAIPost) {
            let aiUser = await User.findOne({ 'profile.full_name': 'HealthMate AI Coach' });
            if (!aiUser) {
                aiUser = await User.create({
                    email: "aicoach_" + Date.now() + "@healthmate.com",
                    password_hash: "AI_ACCOUNT_NO_LOGIN",
                    role: "admin",
                    profile: { full_name: "HealthMate AI Coach", picture: "https://api.dicebear.com/7.x/bottts/svg?seed=HealthMate&backgroundColor=12ec5b" }
                });
            }
            const newAIPost = await Post.create({
                content: "🤖 Xin chào! Mình là HealthMate AI Coach.\n\n🔥 Lời khuyên hôm nay: Đừng quên giãn cơ 5 phút sau mỗi buổi tập để tránh chấn thương nhé!",
                user: aiUser._id,
                tag: 'AI Coach',
                isAIPost: true,
                createdAt: new Date()
            });
            const populatedPost = await Post.findById(newAIPost._id).populate('user', 'profile.full_name profile.picture');
            posts.unshift(populatedPost);
        }
    }
    res.json(posts);
  } catch (err) { res.status(500).json(err); }
});

router.put('/posts/:id', protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || content.trim() === '') return res.status(400).json({ message: "Nội dung bài viết không được để trống." });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });

        if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền sửa bài viết này." });
        }

        post.content = content;
        await post.save();

        const updatedPost = await Post.findById(req.params.id).populate('user comments.user', 'profile.full_name profile.picture');
        if (global.io) global.io.emit('post_updated', updatedPost);
        res.json(updatedPost);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/posts/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });

        if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này." });
        }

        await Post.findByIdAndDelete(req.params.id);
        if (global.io) global.io.emit('post_deleted', req.params.id);
        res.json({ message: "Đã xóa bài viết thành công." });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id; 
    if (post.likes.includes(userId)) post.likes = post.likes.filter(id => id.toString() !== userId);
    else post.likes.push(userId);
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id).populate('user comments.user', 'profile.full_name profile.picture');
    if (global.io) global.io.emit('post_updated', updatedPost); 
    res.json(updatedPost);
  } catch (err) { res.status(500).json(err); }
});

router.post('/posts/:id/comment', protect, async (req, res) => {
  try {
    if (!req.body.text || req.body.text.trim() === '') return res.status(400).json({ message: "Bình luận không được để trống." });
    
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user.id, text: req.body.text, createdAt: new Date() });
    await post.save();

    const updatedPost = await Post.findById(req.params.id).populate('user comments.user', 'profile.full_name profile.picture');
    if (global.io) global.io.emit('post_updated', updatedPost); 
    res.json(updatedPost);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/posts', protect, upload.single('media'), async (req, res) => {
  try {
    if (!req.file && (!req.body.content || req.body.content.trim() === '')) {
        return res.status(400).json({ message: "Bài viết phải có hình ảnh/video hoặc nội dung văn bản." });
    }

    const newPost = new Post({
      content: req.body.content || '',
      user: req.user.id,
      tag: req.body.tag || 'Update',
      location: req.body.location || '',
      mediaUrl: req.file ? req.file.path : '',
      mediaType: req.file ? req.file.mimetype : '',
      groupId: req.body.groupId || null,
      createdAt: new Date()
    });
    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id).populate('user comments.user', 'profile.full_name profile.picture');
    
    if (global.io) global.io.emit('new_post', populatedPost); 
    res.status(201).json(populatedPost);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/posts/:id/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id; 
    if (!post.savedBy) post.savedBy = [];
    if (post.savedBy.includes(userId)) post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
    else post.savedBy.push(userId);
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id).populate('user comments.user', 'profile.full_name profile.picture');
    if (global.io) global.io.emit('post_updated', updatedPost); 
    res.json(updatedPost);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const users = await User.find({}, 'profile.full_name profile.picture daily_routine');
    const workoutRank = users.map(user => {
        const monthlyRoutines = (user.daily_routine || []).filter(r => new Date(r.date) >= startOfMonth);
        return { _id: user._id, name: user.profile?.full_name || 'Unknown', picture: user.profile?.picture, score: monthlyRoutines.reduce((acc, curr) => acc + (curr.exercises?.length || 0), 0) }
    }).filter(user => user.score > 0 && user.name !== 'HealthMate AI Coach').sort((a, b) => b.score - a.score).slice(0, 10);
    const postCounts = await Post.aggregate([ { $match: { isAIPost: { $ne: true }, createdAt: { $gte: startOfMonth } } }, { $group: { _id: '$user', count: { $sum: 1 } } } ]);
    const contributionRank = postCounts.map(pc => {
        const u = users.find(user => user._id.toString() === pc._id?.toString());
        if(!u) return null;
        return { _id: u._id, name: u.profile?.full_name, picture: u.profile?.picture, score: pc.count };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 10);
    const monthlyChallenges = await Challenge.find({ createdAt: { $gte: startOfMonth } });
    const challengeCounts = {};
    monthlyChallenges.forEach(c => { c.participants.forEach(pId => { challengeCounts[pId.toString()] = (challengeCounts[pId.toString()] || 0) + 1; }); });
    const challengeRank = Object.entries(challengeCounts).map(([userId, count]) => {
        const u = users.find(user => user._id.toString() === userId);
        if(!u) return null;
        return { _id: u._id, name: u.profile?.full_name, picture: u.profile?.picture, score: count };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 10);
    res.json({ workout: workoutRank, contribution: contributionRank, challenge: challengeRank });
  } catch (err) { res.status(500).json(err); }
});

router.get('/groups', async (req, res) => {
  try { res.json(await Group.find().populate('admin members', 'profile.full_name profile.picture')); } 
  catch (err) { res.status(500).json(err); }
});
router.get('/groups/:id', async (req, res) => {
  try { res.json(await Group.findById(req.params.id).populate('admin members', 'profile.full_name profile.picture')); } 
  catch (err) { res.status(500).json(err); }
});
router.post('/groups', protect, async (req, res) => {
  try {
      if(!req.body.name || req.body.name.trim().length < 3) return res.status(400).json({message: "Tên nhóm phải từ 3 ký tự trở lên."});
      res.status(201).json(await Group.create({ name: req.body.name, description: req.body.description, admin: req.user.id, members: [req.user.id] }));
  } catch (err) { res.status(500).json(err); }
});
router.put('/groups/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (group.members.includes(req.user.id)) group.members = group.members.filter(id => id.toString() !== req.user.id);
    else group.members.push(req.user.id);
    await group.save(); res.json(group);
  } catch (err) { res.status(500).json(err); }
});

router.get('/challenges', protect, async (req, res) => {
  try {
    const challenges = await Challenge.find({ $or: [{ isPrivate: false }, { isPrivate: { $exists: false } }, { participants: req.user.id }] })
      .populate('creator participants', 'profile.full_name profile.picture').sort({ createdAt: -1 });
    res.json(challenges);
  } catch (err) { res.status(500).json(err); }
});

// 🔴 ĐÃ THÊM VALIDATE KỸ HƠN CHO MỤC TIÊU (Max Limit)
router.post('/challenges', protect, async (req, res) => {
  try {
    const { title, target, metric, isPrivate } = req.body;
    
    if (!title || title.trim().length < 5) return res.status(400).json({ message: "Tên thử thách phải từ 5 ký tự trở lên." });
    
    const targetNum = Number(target);
    if (!targetNum || targetNum <= 0) return res.status(400).json({ message: "Mục tiêu phải là số lớn hơn 0." });
    
    // Giới hạn max theo từng đơn vị
    const limits = { 'KM': 10000, 'Lần': 100000, 'Giờ': 5000, 'Ngày': 365 };
    if (!limits[metric]) return res.status(400).json({ message: "Đơn vị đo lường không hợp lệ." });
    
    if (targetNum > limits[metric]) {
        return res.status(400).json({ message: `Mục tiêu quá phi lý! Tối đa cho ${metric} là ${limits[metric].toLocaleString('vi-VN')}.` });
    }

    const newChallenge = await Challenge.create({
        title, target: targetNum, metric,
        creator: req.user.id, participants: [req.user.id], isPrivate: isPrivate || false
    });

    if (!isPrivate) {
        const newPost = new Post({
            content: `🔥 Tôi vừa tạo thử thách cộng đồng mới: **${title}** (Mục tiêu: ${targetNum} ${metric}).\n\nHãy vào mục **My Challenges** để tham gia cùng tôi ngay nhé!`,
            user: req.user.id, tag: 'Challenge', createdAt: new Date()
        });
        const savedPost = await newPost.save();
        const populatedPost = await Post.findById(savedPost._id).populate('user', 'profile.full_name profile.picture');
        if (global.io) global.io.emit('new_post', populatedPost);
    }
    res.status(201).json(newChallenge);
  } catch (err) { res.status(500).json(err); }
});

router.put('/challenges/:id/join', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge.participants.includes(req.user.id)) { challenge.participants.push(req.user.id); await challenge.save(); }
    res.json(challenge);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;