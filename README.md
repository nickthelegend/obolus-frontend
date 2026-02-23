# ☘️ Obolus :: Private Perpetual DEX

**The first sub-second, privacy-preserving Perpetual DEX on Starknet.**

Powered by **Starknet** + **Tongo (ElGamal Encryption)** + **Pyth Hermes**.

---

## 🛡️ Privacy as a Feature
In traditional DEXs, every position is public. Obolus hides your financial footprint using **ElGamal Homomorphic Encryption**:
- **Sealed Positions**: Your position size, entry price, and leverage are stored as ciphertexts.
- **Encrypted Collateral**: Your balance is hidden from on-chain observers.
- **Viewing Keys**: Selective disclosure for regulatory compliance and auditing.

---

## 🚀 Implementation Status (Hackathon Build)

### ⛓️ Smart Contracts (Cairo 2.0)
- [x] **ObolusPerp**: Sealed perpetual engine using ElGamal position storage.
- [x] **ObolusCollateral**: Encrypted account balances with homomorphic logic support.
- [x] **ViewingKey**: Selective disclosure system for private data.
- [x] **ObolusOracle**: On-chain price feed for settlement.
- [x] **ObolusPool**: Privacy-preserving AMM (ShadowPool fork).

### 🎨 Frontend (Next.js)
- [x] **High-Aesthetic UI**: Dark-mode, high-fidelity trading dashboard.
- [x] **Encryption Constants**: Pre-docked to local Devnet addresses.
- [x] **Encryption Pipeline**: Simulated homomorphic pipeline.
- [ ] **Tongo SDK Integration**: Transitioning from simulation to real EC math (Work in Progress).

### 🛠️ Technical Stack
| Layer      | Stack |
|-----------|--------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand |
| **Blockchain** | Starknet (Cairo 2.x), ElGamal Encryption |
| **Tooling** | Scarb, Starknet Foundry (sncast), Starknet Devnet |
| **Oracle** | Pyth Network (Hermes API for settlement) |

---

## 🏗️ Technical Architecture
Obolus implements a **Hybrid Privacy Model**:
1. **On-Chain Privacy**: All sensitive state variables are stored as $(L, R)$ ciphertext pairs.
2. **Homomorphic Settlement**: Margin updates use additive property $Enc(m_1) + Enc(m_2) = Enc(m_1 + m_2)$ to avoid decryption.
3. **ZK-Verifiers**: Placeholders for ZK-proofs that ensure traders are solvent without revealing their net worth.

---

## Getting Started

### 1. Install
```bash
npm install
```

### 2. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Resources
- [Starknet](https://starknet.io/)
- [Tongo SDK](https://github.com/fatsolutions/tongo-sdk)
- [Pyth Network](https://pyth.network/)
