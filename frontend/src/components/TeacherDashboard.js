import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import contractABI from '../abi.json';

function TeacherDashboard({ user }) {
    const [contract, setContract] = useState(null);
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [studentAddress, setStudentAddress] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentRegNumber, setStudentRegNumber] = useState('');
    const [authorizedStudents, setAuthorizedStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [newTeacherAddress, setNewTeacherAddress] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [teacherAddress, setTeacherAddress] = useState('');

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

                const currentAddress = await signer.getAddress();
                setWalletAddress(currentAddress);

                const teacher = await contractInstance.teacher();
                setTeacherAddress(teacher);

                if (currentAddress.toLowerCase() !== teacher.toLowerCase()) {
                    alert('You are not the teacher. Please switch to the teacher wallet.');
                }

                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/submissions`);
                setSubmissions(res.data);

                const studentsRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/students`);
                setAuthorizedStudents(studentsRes.data);

                const count = await contractInstance.assignmentCount();
                const fetchedAssignments = [];
                for (let i = 1; i <= count; i++) {
                    const assignment = await contractInstance.assignments(i);
                    fetchedAssignments.push({
                        id: Number(assignment.id),
                        description: assignment.description,
                        deadline: new Date(Number(assignment.deadline) * 1000).toLocaleString(),
                        isActive: assignment.isActive
                    });
                }
                setAssignments(fetchedAssignments);
            } catch (error) {
                console.error('Error initializing dashboard:', error);
                alert('Failed to initialize dashboard. Check console for details.');
            }
        };
        init();
    }, []);

    const handleCreateAssignment = async () => {
        if (!contract) return;
        try {
            const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
            const tx = await contract.createAssignment(description, deadlineTimestamp);
            await tx.wait();
            alert('Assignment created!');
            const count = await contract.assignmentCount();
            const newAssignment = await contract.assignments(count);
            setAssignments([...assignments, {
                id: Number(newAssignment.id),
                description: newAssignment.description,
                deadline: new Date(Number(newAssignment.deadline) * 1000).toLocaleString(),
                isActive: newAssignment.isActive
            }]);
            setDescription('');
            setDeadline('');
        } catch (error) {
            console.error(error);
            alert('Error creating assignment');
        }
    };

    const handleAuthorizeStudent = async () => {
        if (!contract) return;
        try {
            const tx = await contract.authorizeStudent(studentAddress);
            await tx.wait();
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/register`, {
                walletAddress: studentAddress,
                name: studentName,
                registrationNumber: studentRegNumber
            });
            alert('Student authorized and registered!');
            setAuthorizedStudents([...authorizedStudents, res.data.student]);
            setStudentAddress('');
            setStudentName('');
            setStudentRegNumber('');
        } catch (error) {
            console.error(error);
            alert('Error authorizing student');
        }
    };

    const handleTransferTeacher = async () => {
        if (!contract) return;
        try {
            const tx = await contract.transferTeacher(newTeacherAddress);
            await tx.wait();
            alert('Teacher role transferred!');
            setTeacherAddress(newTeacherAddress);
            setNewTeacherAddress('');
            const currentAddress = await contract.signer.getAddress();
            if (currentAddress.toLowerCase() !== newTeacherAddress.toLowerCase()) {
                alert('You are no longer the teacher. Switch wallets to continue.');
            }
        } catch (error) {
            console.error(error);
            alert('Error transferring teacher role');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 tracking-tight">
                    Teacher Dashboard
                </h2>
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <p className="text-lg text-gray-700">
                        Welcome, <span className="font-semibold text-indigo-600">Teacher</span>
                    </p>
                    <p className="text-gray-600">
                        Connected Wallet: <span className="font-medium text-indigo-500 truncate">{walletAddress || 'Not connected'}</span>
                    </p>
                    <p className="text-gray-600">
                        Teacher Address: <span className="font-medium text-indigo-500 truncate">{teacherAddress || 'Loading...'}</span>
                    </p>
                </div>

                {/* Transfer Teacher Role */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Transfer Teacher Role</h3>
                    <input
                        type="text"
                        value={newTeacherAddress}
                        onChange={(e) => setNewTeacherAddress(e.target.value)}
                        placeholder="New Teacher Wallet Address"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    />
                    <button
                        onClick={handleTransferTeacher}
                        className="w-full mt-4 bg-red-600 text-white p-3 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
                    >
                        Transfer Teacher Role
                    </button>
                </div>

                {/* Authorize Student */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Authorize Student</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={studentAddress}
                            onChange={(e) => setStudentAddress(e.target.value)}
                            placeholder="Student Wallet Address"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                        <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Student Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                        <input
                            type="text"
                            value={studentRegNumber}
                            onChange={(e) => setStudentRegNumber(e.target.value)}
                            placeholder="Registration Number"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                        <button
                            onClick={handleAuthorizeStudent}
                            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                        >
                            Authorize Student
                        </button>
                    </div>
                </div>

                {/* Authorized Students */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Authorized Students</h3>
                    {authorizedStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr className="bg-indigo-50 text-indigo-700 uppercase text-sm">
                                        <th className="py-3 px-6 text-left">Name</th>
                                        <th className="py-3 px-6 text-left">Reg Number</th>
                                        <th className="py-3 px-6 text-left">Wallet Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {authorizedStudents.map((student, index) => (
                                        <tr
                                            key={index}
                                            className="border-b hover:bg-gray-50 transition duration-200"
                                        >
                                            <td className="py-3 px-6 text-gray-800">{student.name}</td>
                                            <td className="py-3 px-6 text-gray-800">{student.registrationNumber}</td>
                                            <td className="py-3 px-6 text-indigo-600 truncate">{student.walletAddress}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No students authorized yet.</p>
                    )}
                </div>

                {/* Create Assignment */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Create Assignment</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Assignment Description"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                        />
                        <button
                            onClick={handleCreateAssignment}
                            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                        >
                            Create Assignment
                        </button>
                    </div>
                </div>

                {/* Created Assignments */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Created Assignments</h3>
                    {assignments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr className="bg-indigo-50 text-indigo-700 uppercase text-sm">
                                        <th className="py-3 px-6 text-left">ID</th>
                                        <th className="py-3 px-6 text-left">Description</th>
                                        <th className="py-3 px-6 text-left">Deadline</th>
                                        <th className="py-3 px-6 text-left">Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((assignment, index) => (
                                        <tr
                                            key={index}
                                            className="border-b hover:bg-gray-50 transition duration-200"
                                        >
                                            <td className="py-3 px-6 text-gray-800">{assignment.id}</td>
                                            <td className="py-3 px-6 text-gray-800">{assignment.description}</td>
                                            <td className="py-3 px-6 text-gray-800">{assignment.deadline}</td>
                                            <td className="py-3 px-6 text-indigo-600">
                                                {assignment.isActive ? 'Yes' : 'No'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No assignments created yet.</p>
                    )}
                </div>

                {/* Submitted Assignments */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Submitted Assignments</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-indigo-50 text-indigo-700 uppercase text-sm">
                                    <th className="py-3 px-6 text-left">Assignment ID</th>
                                    <th className="py-3 px-6 text-left">Student Name</th>
                                    <th className="py-3 px-6 text-left">Reg Number</th>
                                    <th className="py-3 px-6 text-left">File Hash</th>
                                    <th className="py-3 px-6 text-left">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub, index) => (
                                    <tr
                                        key={index}
                                        className="border-b hover:bg-gray-50 transition duration-200"
                                    >
                                        <td className="py-3 px-6 text-gray-800">{sub.assignmentId}</td>
                                        <td className="py-3 px-6 text-gray-800">{sub.studentName}</td>
                                        <td className="py-3 px-6 text-gray-800">{sub.registrationNumber}</td>
                                        <td className="py-3 px-6">
                                            <a
                                                href={`https://gateway.pinata.cloud/ipfs/${sub.fileHash}`}
                                                target="_blank"
                                                className="text-indigo-600 hover:underline truncate"
                                            >
                                                {sub.fileHash.slice(0, 10)}...
                                            </a>
                                        </td>
                                        <td className="py-3 px-6 text-gray-800">{new Date(sub.timestamp * 1000).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;