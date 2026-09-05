import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Dogs from './pages/Dogs';
import DogProfile from './pages/DogProfile';
import Stays from './pages/Stays';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dogs" element={<Dogs />} />
            <Route path="dogs/:id" element={<DogProfile />} />
            <Route path="stays" element={<Stays />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
