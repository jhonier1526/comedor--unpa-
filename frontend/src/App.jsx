// App.jsx
import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';
import LoginAdmin from './components/LoginAdmin';
import { useApp } from './context/AppContext';
import './index.css';

function AppContent() {
  const { isAdmin, logoutAdmin } = useApp();
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin && !isAdmin) {
    return <LoginAdmin onBack={() => setShowLogin(false)} />;
  }

  if (isAdmin) {
    return <AdminView onLogout={() => { logoutAdmin(); setShowLogin(false); }} />;
  }

  return <StudentView onAdminClick={() => setShowLogin(true)} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}