const contractAddress = "0xb3F2f75C5278E3a98c3E6b69F73768B7bd337421";
const tokenAddress = "0xd479ae350dc24168e8db863c5413c35fb2044ecd";
const abi = [
  { "inputs": [{ "internalType": "address", "name": "_kjcToken", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "CLAIM_INTERVAL", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "REWARD_RATE_PER_YEAR", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "SECONDS_IN_YEAR", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "claim", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getStakeCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "kjcToken", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }, { "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "pendingReward", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "tierDays", "type": "uint256" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "stakes",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint256", "name": "lockPeriod", "type": "uint256" },
      { "internalType": "uint256", "name": "lastClaimTime", "type": "uint256" },
      { "internalType": "bool", "name": "claimed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

let web3, contract, accounts;

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    accounts = await web3.eth.getAccounts();
    contract = new web3.eth.Contract(abi, contractAddress);
    document.getElementById("status").innerText = "✅ Connected: " + accounts[0];
    loadStakes();
  } else {
    alert("Please install MetaMask or Bitget Wallet.");
  }
}

async function stake() {
  const amount = document.getElementById("stakeAmount").value;
  const tierDays = document.getElementById("stakeTier").value;
  const token = new web3.eth.Contract([
    { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
  ], tokenAddress);

  const weiAmount = web3.utils.toWei(amount, 'ether');
  await token.methods.approve(contractAddress, weiAmount).send({ from: accounts[0] });
  await contract.methods.stake(weiAmount, tierDays).send({ from: accounts[0] });
  loadStakes();
}

async function loadStakes() {
  const container = document.getElementById("stakesContainer");
  container.innerHTML = "";
  const count = await contract.methods.getStakeCount(accounts[0]).call();
  for (let i = 0; i < count; i++) {
    const s = await contract.methods.stakes(accounts[0], i).call();
    const reward = await contract.methods.pendingReward(accounts[0], i).call();
    const now = Math.floor(Date.now() / 1000);
    const canClaim = now - s.lastClaimTime >= 15 * 24 * 60 * 60;

    const div = document.createElement("div");
    div.className = "stake-card";
    div.innerHTML = `
      <p>Amount: ${web3.utils.fromWei(s.amount)} KJC</p>
      <p>Start: ${new Date(s.startTime * 1000).toLocaleDateString()}</p>
      <p>Reward: ${web3.utils.fromWei(reward)} KJC</p>
      ${canClaim && !s.claimed ? `<button onclick="claim(${i})">Claim</button>` : `<p>Claim: ${canClaim ? "Available" : "Not yet"}</p>`}
    `;
    container.appendChild(div);
  }
}

async function claim(index) {
  await contract.methods.claim(index).send({ from: accounts[0] });
  loadStakes();
}

document.getElementById("connectWallet").onclick = connectWallet;
document.getElementById("stakeButton").onclick = stake;
