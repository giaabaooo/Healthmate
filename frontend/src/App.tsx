import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// --- User pages ---
import AiCoachPage from './pages/user/AiCoachPage';
import FoodCatalogPage from './pages/user/FoodCatalogPage';
import MealPlannerPage from './pages/user/MealPlannerPage';
import WorkoutDetailPage from './pages/user/WorkoutDetailPage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import ProfilePage from './pages/user/ProfilePage';
import HomePage from './pages/user/HomePage';
import OnboardingPage from './pages/user/OnboardingPage';
import FitnessGoal from './pages/user/FitnessGoals';
import WorkoutsUserPage from './pages/WorkoutsUserPage';

// --- Admin pages ---
import AdminDashboardPage from './pages/user/AdminDashboardPage';
import AdminFoodCatalogPage from './pages/AdminFoodCatalogPage';
import AdminMealPlannerPage from './pages/AdminMealPlannerPage';
import AdminWorkoutsPage from './pages/user/WorkoutsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
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
          <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
        </Route>

        {/* PROTECTED ROUTES - Admin */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/dashboard/foods" element={<AdminFoodCatalogPage />} />
          <Route path="/dashboard/meal-planner" element={<AdminMealPlannerPage />} />
          <Route path="/dashboard/workouts" element={<AdminWorkoutsPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}