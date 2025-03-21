// backend/models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Student', StudentSchema);