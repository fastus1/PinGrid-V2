import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import { BookmarkDragProvider } from './features/bookmarks/context/BookmarkDragContext';
import { GroupDragProvider } from './features/groups/context/GroupDragContext';
import LoginForm from './features/auth/components/LoginForm';
import RegisterForm from './features/auth/components/RegisterForm';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ThemeProvider>
      <GroupDragProvider>
        <BookmarkDragProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 - Redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </BookmarkDragProvider>
      </GroupDragProvider>
    </ThemeProvider>
  );
}

export default App;

