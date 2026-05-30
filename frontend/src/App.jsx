import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/authSlice';
import { Loader2 } from 'lucide-react';

import QRCodesList from './components/QRCodesList.jsx';
import DashboardOverview from './components/DashboardOverview.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

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
const FoldersPage = React.lazy(() => import('./pages/FoldersPage.jsx'));

import TrialWarningBanner from './components/TrialWarningBanner.jsx';
import TrialExpiredModal from './components/TrialExpiredModal.jsx';

const MainDashboardLayout = () => (
  <DashboardLayout>
    <TrialWarningBanner />
    <TrialExpiredModal />
    <Outlet />
  </DashboardLayout>
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
            <Route element={<MainDashboardLayout />}>
              <Route path="/create" element={<CreateQRPage />} />
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/qrcodes" element={<QRCodesList />} />
              <Route path="/qrcodes/:id" element={<QRDetailPage />} />
              <Route path="/folders" element={<FoldersPage />} />
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

