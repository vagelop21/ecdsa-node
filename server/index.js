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
  "0247869b30dcfb2ebecf0d4e64d51432a658c0531b5634041454c5757ec9f95289": 100,
  "0390c87dc184b4ca420f6c28e30acb0f1a40d9ec220f9ea2317d54a83976fe19f5": 50,
  "03a670c05f681029b8baae1e9be0b097db21ed189bf238f6b5ce5bfdef9e2456aa": 75,
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
