import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // Import chú bảo vệ

// --- Import các trang ---
import AiCoachPage from './pages/AiCoachPage';
import FoodCatalogPage from './pages/user/FoodCatalogPage';
import MealPlannerPage from './pages/user/MealPlannerPage';
import AdminFoodFormPage from './pages/admin/AdminFoodFormPage';
import AdminDashboard from './components/AdminDashboard';
import WorkoutsPage from './pages/user/WorkoutsPage';
import WorkoutDetailPage from "./pages/user/WorkoutDetailPage";
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import ProfilePage from './pages/user/ProfilePage';
import HomePage from './pages/user/HomePage';
import OnboardingPage from './pages/user/OnboardingPage';
import FitnessGoal from './pages/user/FitnessGoals';
import WorkoutsUserPage from './pages/WorkoutsUserPage';
import CommunityFeed from './pages/CommunityFeed';
import OverviewPage from './pages/user/Overviewpage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/*PUBLIC ROUTES */}
       
        <Route path="/" element={<Navigate to="/homepage" replace />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/fitness-goals" element={<FitnessGoal />} />

        {/*  PROTECTED ROUTES (Bắt buộc đăng nhập)*/}
        {/* User routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/aicoach" element={<AiCoachPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/foods" element={<FoodCatalogPage />} />
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/workouts" element={<WorkoutsUserPage />} />
          <Route path="/community-feed" element={<CommunityFeed/>} />
            <Route path="/overview" element={<OverviewPage/>} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/foods/new" element={<AdminFoodFormPage />} />
          <Route path="/admin/workouts" element={<WorkoutsPage />} />
          <Route path="/admin/workouts/:id" element={<WorkoutDetailPage />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}