import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TasksPage from './components/TasksPage';
import NewTask from './components/NewTask';
import AdminUsers from './components/AdminUsers';
import AdminTeams from './components/AdminTeams';
import ChangePassword from './components/ChangePassword';
import Help from './components/Help';
import { authService } from './services/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    const savedUser = authService.getUser();
    if (token && savedUser) {
      setUser(savedUser);
      if (savedUser.mustChangePassword) {
        setShowPasswordChange(true);
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.mustChangePassword) {
      setShowPasswordChange(true);
    }
  };

  const handlePasswordChanged = () => {
    setShowPasswordChange(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <BrowserRouter>
      {showPasswordChange && (
        <ChangePassword 
          onSuccess={handlePasswordChanged} 
          isRequired={true}
        />
      )}
      
      <Routes>
        <Route path="/login" element={!user ? <Login onSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
        <Route path="/help" element={<Help />} />
        <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/tasks/:teamId" element={user ? <TasksPage /> : <Navigate to="/login" />} />
        <Route path="/tasks/:teamId/new" element={user ? <NewTask /> : <Navigate to="/login" />} />
        <Route path="/admin/users" element={isAdmin ? <AdminUsers /> : <Navigate to="/" />} />
        <Route path="/admin/teams" element={isAdmin ? <AdminTeams /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
