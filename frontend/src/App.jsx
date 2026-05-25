import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/authSlice';
import { Loader2 } from 'lucide-react';

import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Header from './components/Header.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

const LoginPage = React.lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage.jsx'));
const CreateQRPage = React.lazy(() => import('./pages/create/CreateQRPage.jsx'));
const LandingPage = React.lazy(() => import('./pages/LandingPage.jsx'));
const QRDetailPage = React.lazy(() => import('./pages/QRDetailPage.jsx'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage.jsx'));
const AccountPage = React.lazy(() => import('./pages/AccountPage.jsx'));
const BillingPage = React.lazy(() => import('./pages/BillingPage.jsx'));
const PrivacyDataPage = React.lazy(() => import('./pages/PrivacyDataPage.jsx'));
const PDFViewPage = React.lazy(() => import('./pages/PDFViewPage.jsx'));
const VCardViewPage = React.lazy(() => import('./pages/VCardViewPage.jsx'));
const SocialViewPage = React.lazy(() => import('./pages/SocialViewPage.jsx'));
const MediaViewPage = React.lazy(() => import('./pages/MediaViewPage.jsx'));
const MenuViewPage = React.lazy(() => import('./pages/MenuViewPage.jsx'));

import TrialWarningBanner from './components/TrialWarningBanner.jsx';
import TrialExpiredModal from './components/TrialExpiredModal.jsx';

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
    <main className="flex-1 flex flex-col overflow-auto transition-all duration-300 w-full mt-16 lg:mt-0">
      <TrialWarningBanner />
      <TrialExpiredModal />
      <div className="flex-1">
        <Outlet />
      </div>
    </main>
  </div>
);

// 2. Create Wizard Layout (Special header + Sidebar overlay)
const CreateWizardLayout = ({ isSidebarOpen, onToggle }) => (
  <div className="flex min-h-screen w-full">
    <Sidebar isOpen={isSidebarOpen} overlay={true} />
    <main className="flex-1 flex flex-col overflow-auto w-full">
      <TrialWarningBanner />
      <TrialExpiredModal />
      <div className="flex-1">
        <CreateQRPage isOpen={isSidebarOpen} onToggle={onToggle} />
      </div>
    </main>
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onToggle}
      />
    )}
  </div>
);

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] relative">
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-screen w-full bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm font-semibold text-slate-500">Loading QRVibe...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pdf/:shortId" element={<PDFViewPage />} />
          <Route path="/vcard/:shortId" element={<VCardViewPage />} />
          <Route path="/social/:shortId" element={<SocialViewPage />} />
          <Route path="/media/:shortId" element={<MediaViewPage />} />
          <Route path="/menu/:shortId" element={<MenuViewPage />} />

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
              <Route path="/privacy-data" element={<PrivacyDataPage />} />
            </Route>

          </Route>
        </Routes>
      </React.Suspense>
    </div>
  );
};

export default App;
