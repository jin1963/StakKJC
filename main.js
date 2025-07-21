let web3;
let contract;
let user;

const contractAddress = "0xb3F2f75C5278E3a98c3E6b69F73768B7bd337421"; // Staking
const tokenAddress = "0xd479ae350dc24168e8db863c5413c35fb2044ecd"; // KJC

window.addEventListener("load", async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(stakingABI, contractAddress);
  } else {
    document.getElementById("status").innerText = "❌ No wallet detected.";
  }
});

document.getElementById("connectWallet").onclick = async () => {
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    user = accounts[0];
    document.getElementById("status").innerText = "✅ Connected: " + user;
    loadStakes();
  } catch (err) {
    document.getElementById("status").innerText = "❌ Connection rejected.";
  }
};

document.getElementById("stakeButton").onclick = async () => {
  const amount = document.getElementById("stakeAmount").value;
  const tier = document.getElementById("stakeTier").value;
  if (!user || !amount || !tier) return alert("Please connect wallet and fill all fields.");

  const token = new web3.eth.Contract(erc20ABI, tokenAddress);
  const decimals = await token.methods.decimals().call();
  const amountWithDecimals = web3.utils.toBN(amount * 10 ** decimals);

  // Approve first
  await token.methods.approve(contractAddress, amountWithDecimals).send({ from: user });

  // Then stake
  await contract.methods.stake(amountWithDecimals, tier).send({ from: user });

  loadStakes();
};

async function loadStakes() {
  const stakesContainer = document.getElementById("stakesContainer");
  stakesContainer.innerHTML = "";

  const count = await contract.methods.getStakeCount(user).call();
  const interval = await contract.methods.CLAIM_INTERVAL().call();

  for (let i = 0; i < count; i++) {
    const stake = await contract.methods.stakes(user, i).call();
    const start = parseInt(stake.startTime);
    const lastClaim = parseInt(stake.lastClaimTime);
    const now = Math.floor(Date.now() / 1000);

    const canClaim = now - lastClaim >= interval;
    const reward = await contract.methods.calculateReward(user, i).call();
    const rewardFormatted = web3.utils.fromWei(reward, "ether");

    const div = document.createElement("div");
    div.innerHTML = `
      <p>Amount: ${web3.utils.fromWei(stake.amount, "ether")} KJC</p>
      <p>Start: ${new Date(start * 1000).toLocaleString()}</p>
      <p>Tier: ${stake.tierDays} days</p>
      <p>Reward: ${rewardFormatted} KJC</p>
      ${canClaim ? `<button onclick="claim(${i})">Claim</button>` : `<p>⏳ Wait to claim</p>`}
      <hr/>
    `;
    stakesContainer.appendChild(div);
  }
}

async function claim(index) {
  await contract.methods.claimReward(index).send({ from: user });
  loadStakes();
}
