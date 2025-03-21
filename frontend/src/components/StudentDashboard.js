import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import contractABI from '../abi.json';

function StudentDashboard({ user }) {
    const [contract, setContract] = useState(null);
    const [file, setFile] = useState(null);
    const [assignmentId, setAssignmentId] = useState('');
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contractInstance = new ethers.Contract(
                    process.env.REACT_APP_CONTRACT_ADDRESS,
                    contractABI,
                    signer
                );
                setContract(contractInstance);

                const count = await contractInstance.assignmentCount();
                const fetchedAssignments = [];
                for (let i = 1; i <= count; i++) {
                    const assignment = await contractInstance.assignments(i);
                    if (assignment.isActive) {
                        fetchedAssignments.push({
                            id: Number(assignment.id),
                            description: assignment.description,
                            deadline: new Date(Number(assignment.deadline) * 1000).toLocaleString()
                        });
                    }
                }
                setAssignments(fetchedAssignments);
            } catch (error) {
                console.error('Error initializing dashboard:', error);
                alert('Failed to load assignments. Check console for details.');
            }
        };
        init();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const submitAssignment = async () => {
        if (!file || !assignmentId) return alert('Please select a file and assignment ID');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileHash = res.data.fileHash;

            const tx = await contract.submitAssignment(assignmentId, fileHash);
            await tx.wait();
            alert('Assignment submitted successfully!');
            setFile(null);
            setAssignmentId('');
        } catch (error) {
            console.error(error);
            alert('Error submitting assignment');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 tracking-tight">
                    Student Dashboard
                </h2>
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <p className="text-lg text-gray-700">
                        Welcome, <span className="font-semibold text-indigo-600">{user.name}</span>
                    </p>
                    <p className="text-gray-600">Registration: <span className="font-medium">{user.registrationNumber}</span></p>
                    <p className="text-gray-600 truncate">
                        Wallet: <span className="font-medium text-indigo-500">{user.walletAddress}</span>
                    </p>
                </div>

                {/* Available Assignments */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Available Assignments</h3>
                    {assignments.length > 0 ? (
                        <div className="grid gap-4">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300"
                                >
                                    <p className="text-sm text-gray-500">
                                        <span className="font-semibold text-gray-700">ID:</span> {assignment.id}
                                    </p>
                                    <p className="text-gray-800 font-medium mt-1">{assignment.description}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-semibold text-gray-700">Deadline:</span> {assignment.deadline}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No active assignments available.</p>
                    )}
                </div>

                {/* Submit Assignment */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Submit Assignment</h3>
                    <div className="space-y-4">
                        <input
                            type="number"
                            placeholder="Assignment ID"
                            value={assignmentId}
                            onChange={(e) => setAssignmentId(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="w-full p-2 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition duration-200"
                        />
                        <button
                            onClick={submitAssignment}
                            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                        >
                            Submit Assignment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;