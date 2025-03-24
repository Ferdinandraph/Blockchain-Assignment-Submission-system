import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        try {
            const parsedUser = savedUser ? JSON.parse(savedUser) : null;
            if (parsedUser && (!parsedUser.type || !parsedUser.data)) {
                console.warn('Invalid user data in localStorage, resetting');
                localStorage.removeItem('user');
                return null;
            }
            return parsedUser;
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
            localStorage.removeItem('user');
            return null;
        }
    });

    const location = useLocation();

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    useEffect(() => {
        if (location.pathname === '/' && user) {
            setUser(null);
        }
    }, [location.pathname, user]);

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-indigo-700 text-white p-4 shadow-lg sticky top-0 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center space-x-3 hover:text-indigo-200 transition duration-200">
                        <img
                            src="/logoas.png"
                            alt="Assignment System Logo"
                            className="h-12 w-12 object-contain"
                        />
                        <span className="text-2xl font-extrabold tracking-tight">
                            Assignment System
                        </span>
                    </Link>
                    {user && user.data && location.pathname !== '/' && (
                        <div className="flex items-center space-x-6">
                            <span className="text-sm font-medium truncate max-w-xs">
                                {user.type === 'teacher'
                                    ? `Teacher (${user.data.walletAddress?.slice(0, 6)}...${user.data.walletAddress?.slice(-4)})`
                                    : `${user.data.name || 'Student'} (${user.data.registrationNumber || 'N/A'})`}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<Login setUser={setUser} />} />
                    <Route
                        path="/teacher"
                        element={user?.type === 'teacher' ? <TeacherDashboard user={user.data} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/student"
                        element={user?.type === 'student' ? <StudentDashboard user={user.data} /> : <Navigate to="/" />}
                    />
                </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-indigo-800 text-white py-4">
                <div className="container mx-auto text-center">
                    <p className="text-sm">© 2025 Blockchain Assignment System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;