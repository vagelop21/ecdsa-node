const secp = require("ethereum-cryptography/secp256k1");
const keccak = require("ethereum-cryptography/keccak")
const { utf8ToBytes } = require("ethereum-cryptography/utils")
const {toHex} = require("ethereum-cryptography/utils");

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "039b5683bb7b18c374bea131cbf091492b62ffe5562bc3b876fbe5a4a49bc2f1db": 100,
  "03ad1b4c47cf20e22f051d4937c6eae410db80c01b77448e04cb45108eda8313ae": 50,
  "024921f221635f257d6fcbdf3023c758f2b052d4cc7e873f480191aaa3441d9505": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

function hashMessage(message) {
  const bytes = utf8ToBytes(message)
  const hash = keccak.keccak256(bytes)
  return hash
}

app.post("/send", (req, res) => {

  const {messageStr, signedMsgStruct} = req.body;

  const message = JSON.parse(messageStr)
  const msgHash = hashMessage(messageStr)

  let signedMsg = secp.secp256k1.Signature.fromCompact(signedMsgStruct.signedMsgHex)
  signedMsg = signedMsg.addRecoveryBit(signedMsgStruct.recoveryBit)
  
  const sender = toHex(signedMsg.recoverPublicKey(msgHash).toRawBytes())
  const { recipient, amount } = message;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
