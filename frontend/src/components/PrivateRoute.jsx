import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
    const { isAuthenticated, isCheckingSession } = useSelector((state) => state.auth);

    // Only block rendering with the loading state during initial session verification
    // when not yet authenticated. Never unmount active child routes during a background refresh.
    if (isCheckingSession && !isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
