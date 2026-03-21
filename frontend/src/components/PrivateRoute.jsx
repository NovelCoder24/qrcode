import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => { 
    const { isAuthenticated, loading } = useSelector((state) => state.auth);

    // 2. While checking validation, show a spinner (Skeleton later)
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // 3. If valid, render child routes (Outlet). If not, redirect to login.
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
