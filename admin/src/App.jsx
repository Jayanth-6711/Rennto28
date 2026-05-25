import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Owners from "./pages/Owners";
import Properties from "./pages/Properties";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import { NotificationProvider } from "./context/NotificationContext";

import "./App.css";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem("isLoggedIn") === "true";
    });

    useEffect(() => {
        // Handle changes if necessary, but initial sync is now handled in useState initializer
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        localStorage.setItem("isLoggedIn", "true");
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem("isLoggedIn");
    };

    // Wrapper component for authenticated layout
    const AuthenticatedLayout = ({ children }) => (
        <NotificationProvider>
            {children}
        </NotificationProvider>
    );

    return (
        <Router>
            <div className="app">
                <Routes>
                    {/* Public Route */}
                    <Route 
                        path="/login" 
                        element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
                    />
                    
                    {/* Authenticated Routes */}
                    <Route 
                        path="*" 
                        element={
                            isAuthenticated ? (
                                <AuthenticatedLayout>
                                    <Routes>
                                        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
                                        <Route path="/owners" element={<Owners onLogout={handleLogout} />} />
                                        <Route path="/properties" element={<Properties onLogout={handleLogout} />} />
                                        <Route path="/bookings" element={<Bookings onLogout={handleLogout} />} />
                                        <Route path="/payments" element={<Payments onLogout={handleLogout} />} />
                                        <Route path="/complaints" element={<Complaints onLogout={handleLogout} />} />
                                        <Route path="/reports" element={<Reports onLogout={handleLogout} />} />
                                        <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                                        {/* Catch all for authenticated users */}
                                        <Route path="*" element={<Navigate to="/" />} />
                                    </Routes>
                                </AuthenticatedLayout>
                            ) : (
                                <Navigate to="/login" />
                            )
                        } 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;