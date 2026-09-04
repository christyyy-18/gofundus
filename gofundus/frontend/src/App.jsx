import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import InstitutionRegister from './pages/InstitutionRegister';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import MatchResults from './pages/MatchResults';
import DonorProfile from './pages/DonorProfile';
import OrphanagePortal from './pages/OrphanagePortal';
import Support from './pages/Support';
import AdminSupport from './pages/AdminSupport';
import NavBar from './components/NavBar';
import ToastProvider from './components/ToastProvider';

const App = () => {
  return (
    <Router>
      <ToastProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-institution" element={<InstitutionRegister />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/matches" element={<MatchResults />} />
          <Route path="/profile" element={<DonorProfile />} />
          <Route path="/orphanage-portal" element={<OrphanagePortal />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin/support" element={<AdminSupport />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
};

export default App;
