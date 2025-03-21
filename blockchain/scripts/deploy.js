const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
    const contract = await AssignmentSubmission.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("AssignmentSubmission deployed to:", contractAddress);

    const artifact = await hre.artifacts.readArtifact("AssignmentSubmission");
    const abi = artifact.abi;

    const abiPath = path.resolve(__dirname, '../abi.json');
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    console.log("ABI written to abi.json");

    const envPath = path.resolve(__dirname, '../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, '').trim();
    envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env with CONTRACT_ADDRESS");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });