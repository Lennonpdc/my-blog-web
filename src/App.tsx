import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './features/auth/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect empty path to login or home */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Future Blog Routes will go here */}
      </Routes>
    </Router>
  );
}

export default App;
