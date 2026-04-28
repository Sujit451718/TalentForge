import { Navigate, Route, Routes } from 'react-router-dom';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import Navbar from './components/Navbar.jsx';
import Spinner from './components/Spinner.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Feedback from './pages/Feedback.jsx';
import Home from './pages/Home.jsx';
import Interview from './pages/Interview.jsx';
import Login from './pages/Login.jsx';
import Payment from './pages/Payment.jsx';
import Profile from './pages/Profile.jsx';
import Pricing from './pages/Pricing.jsx';
import Quiz from './pages/Quiz.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ATSScore from './pages/ATSScore.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import JarvisMode from './pages/JarvisMode.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, booting } = useAuth();

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night">
        <Spinner label="Securing session" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, booting, user } = useAuth();

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night">
        <Spinner label="Checking permissions" />
      </div>
    );
  }

  return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-night text-slate-100 transition-colors duration-300">
      <div className="app-grid" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/ats-score"
          element={
            <ProtectedRoute>
              <ATSScore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jarvis"
          element={
            <ProtectedRoute>
              <JarvisMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/:interviewId"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget enabled={isAuthenticated} />
    </div>
  );
}
