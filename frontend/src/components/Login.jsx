import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setUser }) {
    const [role, setRole] = useState('student');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
            } catch (err) {
                setError('Failed to connect wallet');
            }
        } else {
            setError('Please install MetaMask');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (role === 'teacher') {
                await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/teacher/login`, {
                    username,
                    password
                });
                await connectWallet();
                setUser({ type: 'teacher', data: { walletAddress } });
                navigate('/teacher');
            } else {
                if (!walletAddress) {
                    setError('Please connect your wallet');
                    return;
                }
                const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/student/login`, {
                    registrationNumber
                });
                if (res.data.student.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                    setError('Wallet address does not match registered student');
                    return;
                }
                setUser({ type: 'student', data: res.data.student });
                navigate('/student');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-gray-200 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 transform transition-all duration-300 hover:shadow-2xl">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center tracking-tight">
                    Welcome Back
                </h2>

                {/* Role Selection */}
                <div className="mb-6 flex justify-center space-x-6">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="student"
                            checked={role === 'student'}
                            onChange={() => setRole('student')}
                            className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-gray-700 font-medium">Student</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="teacher"
                            checked={role === 'teacher'}
                            onChange={() => setRole('teacher')}
                            className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-gray-700 font-medium">Teacher</span>
                    </label>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {role === 'teacher' ? (
                        <>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 placeholder-gray-400"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Registration Number"
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={connectWallet}
                                    className={`w-full p-3 rounded-lg font-medium text-white transition duration-200 ${
                                        walletAddress
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                >
                                    {walletAddress
                                        ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                                        : 'Connect Wallet'}
                                </button>
                            </div>
                        </>
                    )}
                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;