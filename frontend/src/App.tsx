import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// --- Import các trang ---
import AiCoachPage from './pages/user/AiCoachPage';
import FoodCatalogPage from './pages/user/FoodCatalogPage';
import MealPlannerPage from './pages/user/MealPlannerPage';
import AdminFoodFormPage from './pages/admin/AdminFoodFormPage';

import AdminWorkoutsPage from './pages/admin/AdminWorkoutsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import WorkoutDetailPage from "./pages/user/WorkoutDetailPage";
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import ProfilePage from './pages/user/ProfilePage';
import HomePage from './pages/user/HomePage';
import OnboardingPage from './pages/user/OnboardingPage';
import FitnessGoal from './pages/user/FitnessGoals';
import WorkoutsUserPage from './pages/user/WorkoutsUserPage';
import CommunityFeed from './pages/user/CommunityFeed';
import OverviewPage from './pages/user/Overviewpage';
import AdminFoodCatalogPage from './pages/admin/AdminFoodCatalogPage';
import SubscriptionPage from './pages/user/SubscriptionPage';
import SchedulePage from './pages/user/SchedulePage';
import PostManagement from './pages/admin/PostManagement';
import ChallengeManagement from './pages/admin/ChallengeManagement';
import GroupManagement from './pages/admin/GroupManagement';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Mỗi khi pathname (đường dẫn) thay đổi, cuộn mượt mà lên vị trí 0,0
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Xóa dòng này đi nếu bạn muốn nó nhảy bụp lên đầu ngay lập tức
    });
  }, [pathname]);

  return null;
};
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/*PUBLIC ROUTES */}

        <Route path="/" element={<Navigate to="/homepage" replace />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/fitness-goals" element={<FitnessGoal />} />

        {/* PROTECTED ROUTES - User */}
        <Route element={<ProtectedRoute />}>
          <Route path="/aicoach" element={<AiCoachPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/foods" element={<FoodCatalogPage />} />
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/workouts" element={<WorkoutsUserPage />} />
          <Route path="/community-feed" element={<CommunityFeed />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/schedule" element={<SchedulePage />} />

        </Route>

        {/* PROTECTED ROUTES - Admin */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/foods" element={<AdminFoodCatalogPage />} />
          <Route path="/admin/foods/new" element={<AdminFoodFormPage />} />
          <Route path="/admin/workouts" element={<AdminWorkoutsPage />} />
          <Route path="/admin/workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="/admin/posts" element={<PostManagement />} />
          <Route path="/admin/groups" element={<GroupManagement />} />
          <Route path="/admin/challenges" element={<ChallengeManagement />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}