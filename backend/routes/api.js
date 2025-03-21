const express = require('express');
const router = express.Router();
const pinataSDK = require('@pinata/sdk');
const Student = require('../models/Student');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// Use Sepolia via Infura (no hardcoded wallet)
const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`);
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../blockchain/abi.json'), 'utf8'));
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

// Teacher login (no wallet needed here, handled by frontend)
router.post('/teacher/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (username !== process.env.TEACHER_USERNAME || password !== process.env.TEACHER_PASSWORD) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({ message: 'Teacher logged in' }); // Wallet address comes from frontend
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// Student login
router.post('/student/login', async (req, res) => {
    const { registrationNumber } = req.body;
    try {
        const student = await Student.findOne({ registrationNumber });
        if (!student) {
            return res.status(401).json({ message: 'Invalid registration number' });
        }
        res.json({ message: 'Student logged in', student: { name: student.name, registrationNumber: student.registrationNumber, walletAddress: student.walletAddress } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

router.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
});

// Register student (remove blockchain call, handle in frontend)
router.post('/register', async (req, res) => {
    const { name, registrationNumber, walletAddress } = req.body;
    try {
        const student = new Student({ name, registrationNumber, walletAddress });
        await student.save();
        res.json({ message: 'Student registered', student: { name, registrationNumber, walletAddress } });
    } catch (error) {
        res.status(500).json({ message: 'Error registering student', error });
    }
});

// Upload file to IPFS
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileBuffer = req.file.buffer;
        const readableStream = require('stream').Readable.from(fileBuffer);
        const result = await pinata.pinFileToIPFS(readableStream, {
            pinataMetadata: { name: `assignment-${Date.now()}` },
            pinataOptions: { cidVersion: 0 }
        });
        res.json({ fileHash: result.IpfsHash });
    } catch (error) {
        console.error('Pinata upload error:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

// Get all submissions
router.get('/submissions', async (req, res) => {
    try {
        const submissionCount = await contract.getSubmissionCount();
        const submissions = [];
        for (let i = 1; i <= submissionCount; i++) {
            const sub = await contract.submissions(i);
            const student = await Student.findOne({ walletAddress: sub.student });
            submissions.push({
                assignmentId: sub.assignmentId.toString(),
                walletAddress: sub.student,
                studentName: student?.name || 'Unknown',
                registrationNumber: student?.registrationNumber || 'N/A',
                fileHash: sub.fileHash,
                timestamp: sub.timestamp.toString()
            });
        }
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions', error });
    }
});

module.exports = router;