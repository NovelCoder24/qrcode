import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/authSlice';
import { Loader2 } from 'lucide-react';

import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import DashboardHome from './components/DashboardHome.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import DashboardShell from './components/layout/DashboardShell.jsx';

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

const MainDashboardLayout = () => (
  <DashboardShell>
    <TrialWarningBanner />
    <TrialExpiredModal />
    <Outlet />
  </DashboardShell>
);

const CreateWizardLayout = ({ isSidebarOpen, onToggle }) => (
  <div className="flex min-h-screen w-full bg-background">
    <Sidebar isOpen={isSidebarOpen} overlay={true} />
    <main className="flex min-h-screen flex-1 flex-col overflow-auto w-full">
      <TrialWarningBanner />
      <TrialExpiredModal />
      <div className="flex-1">
        <CreateQRPage isOpen={isSidebarOpen} onToggle={onToggle} />
      </div>
    </main>
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-30"
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
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <React.Suspense fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-semibold text-muted-foreground">Loading QRVibe...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pdf/:shortId" element={<PDFViewPage />} />
          <Route path="/vcard/:shortId" element={<VCardViewPage />} />
          <Route path="/social/:shortId" element={<SocialViewPage />} />
          <Route path="/media/:shortId" element={<MediaViewPage />} />
          <Route path="/menu/:shortId" element={<MenuViewPage />} />

          <Route element={<PrivateRoute />}>
            <Route
              path="/create"
              element={<CreateWizardLayout isSidebarOpen={isSidebarOpen} onToggle={toggleSidebar} />}
            />

            <Route element={<MainDashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
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

