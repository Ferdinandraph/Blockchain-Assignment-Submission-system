require("@nomicfoundation/hardhat-toolbox");
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
    solidity: "0.8.0",
    networks: {
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 11155111
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        hardhat: {
            chainId: 31337,
        }
    }
};
