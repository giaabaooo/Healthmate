# 📋 Checklist Kiểm Tra Tracker & Analyst Module

## 🔧 Backend Testing

### 1. Models Configuration ✅
- [x] **WorkoutLog Model** - `models/WorkoutLog.js`
  - Fields: user_id, workout_id, date, duration_minutes, calories_burned, notes
  - Index on user_id for performance
  - Timestamps for tracking

- [x] **BodyProgress Model** - `models/BodyProgress.js`
  - Fields: user_id, date, weight_kg, body_fat_percentage, note
  - Index on user_id for performance
  - Timestamps for tracking

### 2. API Endpoints Testing

#### 2.1 Lưu lịch sử bài tập ✅
**Endpoint:** `POST https://healthmate-y9vt.onrender.com/api/tracker/workouts`

**Test với Postman/curl:**
```bash
curl -X POST https://healthmate-y9vt.onrender.com/api/tracker/workouts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "duration_minutes": 45,
    "calories_burned": 350,
    "notes": "Tập rất tốt hôm nay!"
  }'
```

**Expected Response:**
```json
{
  "message": "Lưu lịch sử bài tập thành công!",
  "workoutLog": {
    "_id": "...",
    "user_id": "...",
    "workout_id": {
      "name": "Push Day",
      "description": "...",
      "category": "Strength"
    },
    "duration_minutes": 45,
    "calories_burned": 350,
    "notes": "Tập rất tốt hôm nay!",
    "date": "2026-02-26T...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 2.2 Lấy lịch sử bài tập ✅
**Endpoint:** `GET https://healthmate-y9vt.onrender.com/api/tracker/workouts?period=week&limit=10`

**Test:**
```bash
curl -X GET "https://healthmate-y9vt.onrender.com/api/tracker/workouts?period=week&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "workoutLogs": [...],
  "summary": {
    "totalWorkouts": 5,
    "totalCalories": 1750,
    "totalDuration": 225,
    "averageCaloriesPerWorkout": 350
  }
}
```

#### 2.3 Cập nhật cân nặng ✅
**Endpoint:** `POST https://healthmate-y9vt.onrender.com/api/tracker/body-progress`

**Test:**
```bash
curl -X POST https://healthmate-y9vt.onrender.com/api/tracker/body-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight_kg": 75.5,
    "body_fat_percentage": 18.5,
    "note": "Giảm 0.5kg so với tuần trước"
  }'
```

#### 2.4 Lấy dữ liệu tiến trình cơ thể ✅
**Endpoint:** `GET https://healthmate-y9vt.onrender.com/api/tracker/body-progress?period=month`

**Expected Response:**
```json
{
  "bodyProgress": [
    {
      "_id": "...",
      "user_id": "...",
      "date": "2026-02-01T...",
      "weight_kg": 76.0,
      "body_fat_percentage": 19.0,
      "note": "Đầu tháng"
    }
  ],
  "summary": {
    "totalEntries": 5,
    "currentWeight": 75.5,
    "weightChange": -0.5,
    "startWeight": 76.0
  }
}
```

#### 2.5 Dashboard Statistics ✅
**Endpoint:** `GET https://healthmate-y9vt.onrender.com/api/tracker/dashboard-stats`

**Expected Response:**
```json
{
  "today": {
    "workoutsCompleted": 2,
    "caloriesBurned": 650,
    "duration": 85,
    "workoutDetails": [...]
  },
  "week": {
    "totalWorkouts": 8,
    "totalCalories": 2800,
    "totalDuration": 360,
    "averageCaloriesPerDay": 400,
    "averageDurationPerDay": 51
  },
  "body": {
    "currentWeight": 75.5,
    "lastUpdated": "2026-02-26T...",
    "bodyFatPercentage": 18.5
  }
}
```

---

## 🎨 Frontend Testing

### 1. Dashboard Page ✅
**Route:** `http://localhost:5173/dashboard`

**Kiểm tra các thành phần:**

#### 1.1 Stats Cards ✅
- [ ] **Calories Burned Card**
  - Hiển thị total calories tuần này
  - Icon: local_fire_department
  - Trend: +X avg/day

- [ ] **Workouts Card**
  - Hiển thị total workouts tuần này
  - Icon: fitness_center
  - Trend: X today

- [ ] **Current Weight Card**
  - Hiển thị cân nặng hiện tại
  - Icon: monitor_weight
  - Trend: Updated date

- [ ] **Active Time Card**
  - Hiển thị total duration tuần này
  - Icon: timer
  - Trend: X min/day

#### 1.2 Performance Analytics Chart ✅
- [ ] **Chart Display**
  - Bar chart sử dụng Recharts
  - Data từ API: calories/weight/muscle
  - Responsive design

- [ ] **Chart Switching Buttons**
  - Weight button
  - Calories button  
  - Muscle % button
  - Active state styling

#### 1.3 Today's Activities ✅
- [ ] **Activity List**
  - Hiển thị workouts hôm nay
  - Icon, name, category
  - Duration và calories
  - Empty state khi không có data

#### 1.4 Weekly Summary ✅
- [ ] **Summary Grid**
  - Total Workouts
  - Total Calories
  - Minutes
  - Daily Average

### 2. Chart Integration ✅
**Library:** Recharts v3.7.0

**Components sử dụng:**
- `BarChart`, `Bar` cho calories/weight
- `ResponsiveContainer` cho responsive
- `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`

**Data Processing:**
- Format date: `toLocaleDateString('vi-VN')`
- Calculate daily/weekly aggregates
- Handle empty data states

---

## 🧪 Manual Testing Steps

### Step 1: Setup Test Data
1. Login vào ứng dụng
2. Mở browser console trên dashboard
3. Paste script tạo test data:

```javascript
const createTestData = async () => {
  const token = localStorage.getItem('token');
  
  // Tạo body progress data
  const weightData = [
    { weight_kg: 78, note: "Đầu tháng" },
    { weight_kg: 77.5, note: "Tuần 1" },
    { weight_kg: 76.8, note: "Tuần 2" },
    { weight_kg: 76.2, note: "Tuần 3" },
    { weight_kg: 75.5, note: "Hiện tại" }
  ];

  for (let i = 0; i < weightData.length; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (4 - i) * 7);
    
    await fetch('https://healthmate-y9vt.onrender.com/api/tracker/body-progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weight_kg: weightData[i].weight_kg,
        note: weightData[i].note
      })
    });
  }

  // Tạo workout logs
  const workouts = [
    { name: "Push Day", calories: 300, duration: 45 },
    { name: "Pull Day", calories: 280, duration: 40 },
    { name: "Leg Day", calories: 350, duration: 50 },
    { name: "Cardio", calories: 200, duration: 30 },
    { name: "HIIT", calories: 400, duration: 35 }
  ];

  for (let i = 0; i < workouts.length; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    await fetch('https://healthmate-y9vt.onrender.com/api/tracker/workouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workout_id: "64f1a2b3c4d5e6f7g8h9i0j1",
        duration_minutes: workouts[i].duration,
        calories_burned: workouts[i].calories,
        notes: `${workouts[i].name} - ${i === 0 ? 'Hôm nay' : `${i} ngày trước`}`
      })
    });
  }

  alert('Test data created! Refresh dashboard to see changes.');
};

createTestData();
```

### Step 2: Verify Backend APIs
1. Mở Postman/Thunder Client
2. Test từng endpoint ở trên
3. Verify responses return đúng format
4. Check database records trong MongoDB Compass

### Step 3: Verify Frontend Dashboard
1. Truy cập `http://localhost:5173/dashboard`
2. Kiểm tra tất cả components hiển thị
3. Test chart switching functionality
4. Verify data từ API hiển thị đúng
5. Test responsive design (resize browser)

### Step 4: Integration Testing
1. Thêm workout log mới qua API
2. Refresh dashboard → data should update
3. Thêm body progress mới
4. Verify chart reflects new data
5. Test error handling (no token, invalid data)

---

## 🔍 Debugging Tools

### Browser Console
```javascript
// Check API calls
localStorage.getItem('token') // Verify token exists

// Test API directly
fetch('https://healthmate-y9vt.onrender.com/api/tracker/dashboard-stats', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)

// Check component state
// In React DevTools -> DashboardPage component
```

### Network Tab
- Check API requests to `https://healthmate-y9vt.onrender.com/api/tracker/*`
- Verify status codes (200 OK)
- Check response payloads
- Verify Authorization headers

### Database Check
```javascript
// Trong MongoDB Compass
// Query workout_logs collection
db.workout_logs.find({user_id: ObjectId("YOUR_USER_ID")})

// Query body_progress collection  
db.body_progress.find({user_id: ObjectId("YOUR_USER_ID")})
```

---

## ✅ Final Verification Checklist

### Backend ✅
- [ ] Server running on port 8000
- [ ] All tracker routes registered
- [ ] JWT authentication working
- [ ] MongoDB connection stable
- [ ] API responses in correct JSON format

### Frontend ✅
- [ ] Recharts library installed
- [ ] Dashboard route accessible
- [ ] API calls using correct URLs
- [ ] Error handling implemented
- [ ] Responsive design working

### Integration ✅
- [ ] Login flow working
- [ ] Token stored in localStorage
- [ ] Dashboard loads with data
- [ ] Charts render correctly
- [ ] Real-time updates working

---

## 🚀 Performance Considerations

### Backend Optimization
- [ ] Database indexes on user_id fields
- [ ] API response caching if needed
- [ ] Pagination for large datasets
- [ ] Input validation and sanitization

### Frontend Optimization
- [ ] Component memoization for large datasets
- [ ] Chart data debouncing
- [ ] Loading states for better UX
- [ ] Error boundaries for graceful failures

---

**Note:** Run through this checklist after each major change to ensure all Tracker & Analyst functionality remains working correctly!
