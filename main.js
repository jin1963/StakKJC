
const contractAddress = "0xb3F2f75C5278E3a98c3E6b69F73768B7bd337421";
const kjcTokenAddress = "0xd479ae350dc24168e8db863c5413c35fb2044ecd";
const abi = [...]  // คุณต้องใส่ ABI ที่แท้จริงตรงนี้

let web3, contract, accounts;

window.addEventListener("load", async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    document.getElementById("connectWallet").onclick = connectWallet;
    document.getElementById("stakeButton").onclick = stakeTokens;
  } else {
    alert("Please install MetaMask or Bitget Wallet");
  }
});

async function connectWallet() {
  accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  document.getElementById("walletAddress").textContent = "✅ " + accounts[0];
  contract = new web3.eth.Contract(abi, contractAddress);
  loadStakes();
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  const days = document.getElementById("lockPeriod").value;
  const decimals = await new web3.eth.Contract([{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"}], kjcTokenAddress).methods.decimals().call();
  const token = new web3.eth.Contract([{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"}], kjcTokenAddress);
  const amountInWei = web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));
  await token.methods.approve(contractAddress, amountInWei).send({ from: accounts[0] });
  await contract.methods.stake(amountInWei, days).send({ from: accounts[0] });
  loadStakes();
}

async function loadStakes() {
  const stakeCount = await contract.methods.getStakeCount(accounts[0]).call();
  const list = document.getElementById("stakesList");
  list.innerHTML = "";
  for (let i = 0; i < stakeCount; i++) {
    const stake = await contract.methods.stakes(accounts[0], i).call();
    const reward = await contract.methods.pendingReward(accounts[0], i).call();
    const now = Math.floor(Date.now() / 1000);
    const canClaim = now >= parseInt(stake.lastClaimTime) + 15 * 86400;
    const div = document.createElement("div");
    div.className = "stake-entry";
    div.innerHTML = `
      <p>Amount: ${web3.utils.fromWei(stake.amount)} KJC</p>
      <p>Start: ${new Date(stake.startTime * 1000).toLocaleString()}</p>
      <p>Reward: ${web3.utils.fromWei(reward)} KJC</p>
      ${canClaim ? `<button onclick="claim(${i})">Claim</button>` : `<p>Next claim available later</p>`}
    `;
    list.appendChild(div);
  }
}

async function claim(index) {
  await contract.methods.claim(index).send({ from: accounts[0] });
  loadStakes();
}
