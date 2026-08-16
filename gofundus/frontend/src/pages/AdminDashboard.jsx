import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardComponent from '../components/AdminDashboard';
import { useToast } from '../components/ToastProvider';
import { fetchInstitutions } from '../services/api';

const AdminDashboard = () => {
  const [institutions, setInstitutions] = useState([]);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/login');
      return;
    }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'admin') {
        addToast('Access restricted: Admin privileges required.', 'error');
        navigate('/dashboard');
        return;
      }
    } catch {
      navigate('/login');
      return;
    }

    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const data = await fetchInstitutions();
      setInstitutions(data);
    } catch {
      // Fallback
    }
  };

  return (
    <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <AdminDashboardComponent institutions={institutions} onRefresh={loadInstitutions} />
    </section>
  );
};

export default AdminDashboard;
