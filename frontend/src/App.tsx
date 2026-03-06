import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// --- Import các trang ---
import AiCoachPage from './pages/AiCoachPage';
import FoodCatalogPage from './pages/user/FoodCatalogPage';
import MealPlannerPage from './pages/user/MealPlannerPage';
import AdminDashboardPage from './pages/user/AdminDashboardPage';
import AdminMealPlannerPage from './pages/AdminMealPlannerPage';
import AdminFoodCatalogPage from './pages/AdminFoodCatalogPage';
import WorkoutsPage from './pages/user/WorkoutsPage';
import WorkoutDetailPage from "./pages/user/WorkoutDetailPage";
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import ProfilePage from './pages/user/ProfilePage';
import HomePage from './pages/user/HomePage';
import OnboardingPage from './pages/user/OnboardingPage';
import FitnessGoal from './pages/user/FitnessGoals';
import SchedulePage from './pages/user/SchedulePage';
import OverviewPage from './pages/user/Overviewpage';
import WorkoutUser from './pages/user/WorkoutUser';


export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
          },
          success: {
            iconTheme: {
              primary: '#a3e635',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1e293b',
            },
          },
        }}
      />
      <Routes>

        {/*PUBLIC ROUTES */}

        <Route path="/" element={<Navigate to="/homepage" replace />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />


        {/*  PROTECTED ROUTES (Bắt buộc đăng nhập)*/}

        <Route element={<ProtectedRoute />}>
          {/* user */}
          <Route path="/aicoach" element={<AiCoachPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/foods" element={<FoodCatalogPage />} />
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="/fitness-goals" element={<FitnessGoal />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path='/overview' element={<OverviewPage />} />
          <Route path='/workout-user' element={<WorkoutUser />} />
        </Route>

          {/* Admin - chỉ cho phép role === 'admin' */}
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/dashboard/foods" element={<AdminFoodCatalogPage />} />
            <Route path="/dashboard/meal-planner" element={<AdminMealPlannerPage />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
