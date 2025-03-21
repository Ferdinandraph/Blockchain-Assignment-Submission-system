// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AssignmentSubmission {
    struct Assignment {
        uint256 id;
        address creator;
        string description;
        uint256 deadline;
        bool isActive;
    }

    struct Submission {
        uint256 assignmentId;
        address student;
        string fileHash;
        uint256 timestamp;
    }

    mapping(uint256 => Assignment) public assignments;
    mapping(uint256 => Submission) public submissions;
    mapping(address => bool) public authorizedStudents;
    uint256 public assignmentCount;
    uint256 public submissionCount;

    address public teacher;

    event AssignmentCreated(uint256 id, address creator, string description, uint256 deadline);
    event AssignmentSubmitted(uint256 id, address student, string fileHash, uint256 timestamp);
    event StudentAuthorized(address student);
    event TeacherTransferred(address oldTeacher, address newTeacher);

    constructor() {
        teacher = msg.sender; // Initial teacher is deployer
    }

    modifier onlyTeacher() {
        require(msg.sender == teacher, "Only teacher can call this function");
        _;
    }

    // New function to transfer teacher role
    function transferTeacher(address _newTeacher) external onlyTeacher {
        require(_newTeacher != address(0), "Invalid address");
        require(_newTeacher != teacher, "New teacher must be different");
        emit TeacherTransferred(teacher, _newTeacher);
        teacher = _newTeacher;
    }

    function authorizeStudent(address _student) public onlyTeacher {
        require(_student != address(0), "Invalid student address");
        authorizedStudents[_student] = true;
        emit StudentAuthorized(_student);
    }

    function createAssignment(string memory _description, uint256 _deadline) public onlyTeacher {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        assignmentCount++;
        assignments[assignmentCount] = Assignment(assignmentCount, msg.sender, _description, _deadline, true);
        emit AssignmentCreated(assignmentCount, msg.sender, _description, _deadline);
    }

    function submitAssignment(uint256 _assignmentId, string memory _fileHash) public {
        require(authorizedStudents[msg.sender], "Student not authorized");
        require(_assignmentId <= assignmentCount && _assignmentId > 0, "Invalid assignment ID");
        Assignment memory assignment = assignments[_assignmentId];
        require(assignment.isActive, "Assignment is closed");
        require(block.timestamp <= assignment.deadline, "Submission past deadline");

        submissionCount++;
        submissions[submissionCount] = Submission(_assignmentId, msg.sender, _fileHash, block.timestamp);
        emit AssignmentSubmitted(submissionCount, msg.sender, _fileHash, block.timestamp);
    }

    function getSubmissionCount() public view returns (uint256) {
        return submissionCount;
    }
}