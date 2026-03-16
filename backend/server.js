require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import Routes
const workoutRoutes = require("./routes/workoutRoutes");
const workoutCategoryRoutes = require("./routes/workoutCategoryRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const foodRoutes = require("./routes/food-routes");
const mealPlanRoutes = require("./routes/meal-plan-routes");
const progressRoutes = require("./routes/progressRoutes");
const workoutLogRoutes = require("./routes/workoutLogRoutes");
const userWorkoutRoutes = require("./routes/userWorkouts");
const goalRoutes = require("./routes/goalRoutes");
const microGoalRoutes = require("./routes/microGoalRoutes");

// Kết nối database
connectDB();

const app = express();

// Middleware
// Gộp cấu hình CORS lại thành 1 lần duy nhất
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  }),
);

app.use(express.json());

// Khai báo sử dụng Routes
app.use("/api/workouts", workoutRoutes);
app.use("/api/workout-categories", workoutCategoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/meal-plans", mealPlanRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/workout-logs", workoutLogRoutes);
app.use("/api/user/user-workouts", userWorkoutRoutes); // user
app.use("/api/goals", goalRoutes);
app.use("/api/micro-goals", microGoalRoutes);

// API test thử
app.get("/", (req, res) => {
  res.send("Healthmate API đang chạy thành công! 🚀");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
