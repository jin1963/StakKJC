
let web3;
let stakingContract;
let user;

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const accounts = await web3.eth.getAccounts();
    user = accounts[0];
    document.getElementById("wallet-status").innerText = "✅ Connected: " + user;
    stakingContract = new web3.eth.Contract(stakingABI, contractAddress);
    loadStakes();
  } else {
    alert("MetaMask or Bitget Wallet not detected");
  }
}

async function stakeKJC() {
  const amount = document.getElementById("stakeAmount").value;
  const tierDays = document.getElementById("stakeTier").value;
  if (!amount) return alert("Enter amount");

  await stakingContract.methods.stake(web3.utils.toWei(amount), tierDays).send({ from: user });
  alert("Staked!");
  loadStakes();
}

async function loadStakes() {
  const count = await stakingContract.methods.getStakeCount(user).call();
  let html = "";
  for (let i = 0; i < count; i++) {
    const stake = await stakingContract.methods.stakes(user, i).call();
    html += `<div>
      <p>Amount: ${web3.utils.fromWei(stake.amount)}</p>
      <p>Start: ${new Date(stake.startTime * 1000).toLocaleDateString()}</p>
      <p>Locked: ${stake.lockPeriod / 86400} days</p>
    </div>`;
  }
  document.getElementById("myStakes").innerHTML = html || "No stakes";
}

document.getElementById("connectWallet").onclick = connectWallet;
document.getElementById("stakeButton").onclick = stakeKJC;
