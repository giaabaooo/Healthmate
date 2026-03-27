# Hướng dẫn Test Tracker & Analyst API

## 1. Chuẩn bị

### Khởi động server
```bash
cd "e:\Hoc\swd prj\Healthmate"
npm run dev
```

### Khởi động frontend
```bash
cd "e:\Hoc\swd prj\Healthmate\frontend"
npm run dev
```

## 2. Test API với Postman/Thunder Client

### Login để lấy token
```http
POST http://localhost:8000/api/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Copy token từ response để dùng cho các API tiếp theo**

---

## 3. Test Tracker APIs

### 3.1 Lưu lịch sử bài tập
```http
POST http://localhost:8000/api/tracker/workouts
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "workout_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "duration_minutes": 45,
  "calories_burned": 350,
  "notes": "Tập rất tốt hôm nay!"
}
```

### 3.2 Lấy lịch sử bài tập
```http
GET http://localhost:8000/api/tracker/workouts?period=week&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

### 3.3 Cập nhật chỉ số cơ thể
```http
POST http://localhost:8000/api/tracker/body-progress
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "weight_kg": 75.5,
  "body_fat_percentage": 18.5,
  "note": "Giảm 0.5kg so với tuần trước"
}
```

### 3.4 Lấy dữ liệu tiến trình cơ thể
```http
GET http://localhost:8000/api/tracker/body-progress?period=month
Authorization: Bearer YOUR_TOKEN_HERE
```

### 3.5 Lấy thống kê dashboard
```http
GET http://localhost:8000/api/tracker/dashboard-stats
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 4. Test với curl (Terminal)

### Test login
```bash
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test lưu workout log
```bash
curl -X POST http://localhost:8000/api/tracker/workouts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "duration_minutes": 30,
    "calories_burned": 250,
    "notes": "Cardio buổi sáng"
  }'
```

### Test cập nhật cân nặng
```bash
curl -X POST http://localhost:8000/api/tracker/body-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight_kg": 76.0,
    "body_fat_percentage": 19.0,
    "note": "Sau khi tập gym"
  }'
```

---

## 5. Test Frontend

### 5.1 Truy cập Dashboard
1. Mở browser: http://localhost:5173
2. Login với tài khoản đã có
3. Click vào "Dashboard" trong navigation
4. Kiểm tra hiển thị:
   - Stats cards (Calories, Workouts, Weight, Active Time)
   - Performance Analytics chart
   - Today's Activities
   - Weekly Summary

### 5.2 Test chart switching
1. Trong Performance Analytics section:
   - Click "Weight" button
   - Click "Calories" button  
   - Click "Muscle %" button
2. Kiểm tra chart thay đổi tương ứng

### 5.3 Test responsive design
1. Resize browser window
2. Kiểm tra layout trên mobile/tablet/desktop

---

## 6. Tạo Test Data Script

### Script tạo sample data
```javascript
// Paste vào browser console trên trang dashboard
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
    
    await fetch('/api/tracker/body-progress', {
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
    
    await fetch('/api/tracker/workouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workout_id: "64f1a2b3c4d5e6f7g8h9i0j1", // ID workout mẫu
        duration_minutes: workouts[i].duration,
        calories_burned: workouts[i].calories,
        notes: `${workouts[i].name} - ${i === 0 ? 'Hôm nay' : `${i} ngày trước`}`
      })
    });
  }

  alert('Test data created! Refresh dashboard to see changes.');
};

// Chạy script
createTestData();
```

---

## 7. Checklist Testing

### Backend APIs
- [ ] POST /api/tracker/workouts - Lưu workout thành công
- [ ] GET /api/tracker/workouts - Lấy danh sách workout logs
- [ ] POST /api/tracker/body-progress - Cập nhật cân nặng thành công  
- [ ] GET /api/tracker/body-progress - Lấy dữ liệu weight progress
- [ ] GET /api/tracker/dashboard-stats - Lấy thống kê dashboard

### Frontend Dashboard
- [ ] Hiển thị stats cards với dữ liệu thực
- [ ] Chart vẽ đúng dữ liệu calories/weight
- [ ] Chart switching buttons hoạt động
- [ ] Today's activities hiển thị đúng
- [ ] Weekly summary tính toán đúng
- [ ] Responsive design trên mobile
- [ ] Error handling khi không có dữ liệu
- [ ] Loading state hoạt động

### Data Flow
- [ ] API calls có kèm token xác thực
- [ ] Dữ liệu từ API hiển thị đúng trên UI
- [ ] Real-time update sau khi thêm data mới
- [ ] Error messages hiển thị rõ ràng

---

## 8. Troubleshooting

### Common Issues
1. **401 Unauthorized**: Kiểm tra token có hợp lệ không
2. **404 Not Found**: Kiểm tra server đang chạy port 8000
3. **CORS Error**: Kiểm tra frontend port 5173 trong server config
4. **No data displayed**: Tạo test data với script trên
5. **Chart not rendering**: Kiểm tra Recharts đã install chưa

### Debug Tips
- Mở browser DevTools → Network tab để xem API calls
- Kiểm tra Console cho error messages
- Verify database records trong MongoDB Compass
- Test API endpoints riêng lẻ trước khi test frontend
