const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    assignmentId: Number,
    description: String,
    deadline: Number,
    teacherAddress: String
});

module.exports = mongoose.model('Assignment', AssignmentSchema);