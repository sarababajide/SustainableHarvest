# 🌾 SustainableHarvest: Blockchain-Based Incentives for Regenerative Farming

## 📖 Overview
SustainableHarvest is a decentralized application (dApp) that incentivizes farmers to implement regenerative farming practices, such as cover cropping, agroforestry, and biodiversity conservation. Built on the Stacks blockchain with Clarity smart contracts, the platform gamifies sustainability by issuing tokenized rewards (`SUST` tokens) and digital badges for verified regenerative actions. Farmers, verifiers, and stakeholders collaborate transparently to restore ecosystems and promote sustainable agriculture.

## ✨ Features
- 🌱 **Register Regenerative Practices**: Farmers submit practices like soil carbon sequestration or crop rotation with verifiable proof (e.g., IoT data hashes or certifications).
- 🏅 **Earn Rewards**: Farmers receive `SUST` tokens and achievement badges for verified regenerative efforts.
- 🔎 **Transparent Verification**: Independent verifiers (e.g., agricultural experts) validate practices using on-chain records.
- 📈 **Track Impact**: Farmers monitor their environmental impact scores and reward history.
- 💰 **Stake Tokens**: Farmers can stake `SUST` tokens to access benefits like faster verifications or governance voting.
- 🌍 **Biodiversity Credits**: Verified biodiversity efforts can be converted into tradeable credits.
- 🎮 **Gamification**: Leaderboards, challenges, and badges encourage competition and collaboration.
- 🔒 **Immutable Records**: Blockchain ensures transparency and trust for all actions.

## 🛠 How It Works

### For Farmers
1. **Register**: Create a profile with details (name, farm ID, region) via the `farmer-registry` contract.
2. **Submit Practices**: Upload proof of regenerative practices (e.g., SHA-256 hash of soil health data or certifications) to the `practice-submission` contract.
3. **Earn Rewards**: After verification, receive `SUST` tokens from the `reward-distribution` contract and badges from the `achievement-system` contract.
4. **Stake & Trade**: Stake tokens in the `staking-pool` contract for perks or trade biodiversity credits via the `biodiversity-market` contract.
5. **View Leaderboard**: Track rankings and impact through the `gamification-hub` contract.

### For Verifiers
1. **Authenticate**: Register as a verifier in the `verifier-registry` contract.
2. **Review Submissions**: Access pending practices and confirm authenticity using the `verification-engine` contract.
3. **Approve & Reward**: Trigger reward issuance upon approval, ensuring fair and tamper-proof processes.

### For Stakeholders (e.g., NGOs or Buyers)
- Explore verified regenerative farms and purchase biodiversity credits or `SUST` tokens.
- Fund reward pools via the `funding-vault` contract to support global regenerative initiatives.

## 🔗 Smart Contracts (8 Core Contracts in Clarity)
This project uses 8 interconnected Clarity smart contracts for security and scalability:

| Contract Name | Purpose | Key Functions |
|---------------|---------|---------------|
| **farmer-registry** | Manages farmer profiles and authentication. | `register-farmer`, `update-profile`, `get-farmer-details` |
| **verifier-registry** | Registers and manages third-party verifiers. | `register-verifier`, `revoke-verifier`, `is-verified` |
| **practice-submission** | Handles submission of regenerative practices with proofs. | `submit-practice`, `get-submission`, `cancel-submission` |
| **verification-engine** | Core logic for verifying submissions. | `request-verification`, `approve-practice`, `reject-practice` |
| **reward-distribution** | Mints and distributes `SUST` tokens. | `claim-rewards`, `distribute-tokens`, `get-earned-rewards` |
| **achievement-system** | Tracks and awards badges/achievements. | `award-badge`, `get-achievements`, `unlock-milestone` |
| **staking-pool** | Enables staking for benefits and governance. | `stake-tokens`, `unstake`, `calculate-yield` |
| **biodiversity-market** | Facilitates trading of biodiversity credits. | `mint-credit`, `trade-credit`, `redeem-credit` |

*Note: Optional contracts like `gamification-hub` (for leaderboards) and `funding-vault` (for donations) can expand the system to 10 contracts.*

## 🚀 Tech Stack
- **Blockchain**: Stacks (STX) for Bitcoin-anchored security.
- **Smart Contracts**: Clarity (secure, predictable language).
- **Frontend**: React + Hiro Wallet for seamless user interactions.
- **Backend**: Gaia for off-chain storage of large proof data.
- **Tokens**: `SUST` (SIP-10 fungible token for rewards).

## 🤝 Getting Started
1. **Clone the Repo**: `git clone <repo-url>`
2. **Install Dependencies**: Use Clarinet for local development.
3. **Deploy Contracts**: Run `clarinet deploy` on Stacks testnet.
4. **Test**: Simulate farmer submissions and verifications with Clarinet's REPL.
5. **Launch dApp**: Connect via Hiro Wallet and start incentivizing regenerative farming!

## 📜 License
MIT License – Free to fork, build, and regenerate the world!

