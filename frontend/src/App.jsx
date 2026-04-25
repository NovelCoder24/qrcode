import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/authSlice';
import { Analytics } from '@vercel/analytics/react';

import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Header from './components/Header.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CreateQRPage from './pages/create/CreateQRPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import QRDetailPage from './pages/QRDetailPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import PDFViewPage from './pages/PDFViewPage.jsx';
import VCardViewPage from './pages/VCardViewPage.jsx';
import SocialViewPage from './pages/SocialViewPage.jsx';
import MediaViewPage from './pages/MediaViewPage.jsx';

// 1. Dashboard Layout (Uses Outlet for child routes)
const DashboardLayout = ({ isSidebarOpen, onToggle }) => (
  <div className="flex min-h-screen w-full">
    <Header isOpen={isSidebarOpen} onToggle={onToggle} />
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={onToggle}
      />
    )}
    <Sidebar isOpen={isSidebarOpen} />
    <main className="flex-1 overflow-auto transition-all duration-300 w-full mt-16 lg:mt-0">
      <Outlet />
    </main>
  </div>
);

// 2. Create Wizard Layout (Special header + Sidebar overlay)
const CreateWizardLayout = ({ isSidebarOpen, onToggle }) => (
  <>
    <CreateQRPage isOpen={isSidebarOpen} onToggle={onToggle} />
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onToggle}
      />
    )}
    <Sidebar isOpen={isSidebarOpen} overlay={true} />
  </>
);

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] relative">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pdf/:shortId" element={<PDFViewPage />} />
        <Route path="/vcard/:shortId" element={<VCardViewPage />} />
        <Route path="/social/:shortId" element={<SocialViewPage />} />
        <Route path="/media/:shortId" element={<MediaViewPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          {/* Create Wizard Route */}
          <Route
            path="/create"
            element={<CreateWizardLayout isSidebarOpen={isSidebarOpen} onToggle={toggleSidebar} />}
          />

          {/* Main Dashboard Routes */}
          <Route element={<DashboardLayout isSidebarOpen={isSidebarOpen} onToggle={toggleSidebar} />}>
            <Route path="/qrcodes" element={<Dashboard />} />
            <Route path="/qrcodes/:id" element={<QRDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

        </Route>
      </Routes>
      <Analytics />
    </div>
  );
};

export default App;
