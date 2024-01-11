import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1"
import * as keccak from "ethereum-cryptography/keccak"
import { utf8ToBytes } from "ethereum-cryptography/utils"

function hashMessage(message) {
  const bytes = utf8ToBytes(message)
  const hash = keccak.keccak256(bytes)
  return hash
}

async function signMessage(msg, privateKey) {
  const msgHash = hashMessage(msg) 
  const signedMsg = await secp.secp256k1.sign(msgHash,privateKey)
  return signedMsg
}

function Transfer({ privateKey, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    // build the transfer message
    const message = {
      amount: parseInt(sendAmount),
      recipient: recipient
    }

    const messageStr = JSON.stringify(message)

    // sign the message with the private key
    const signedMsg = await signMessage(messageStr,privateKey)
    //const signedMsgStr = JSON.stringify({r: signedMsg.r.toString(), s: signedMsg.s.toString(), recovery: signedMsg.recovery.toString()})
    const signedMsgHex = signedMsg.toCompactHex()    
    // send the message and its signature to the server over the wire

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        // sender: address,
        // amount: parseInt(sendAmount),
        // recipient,
        messageStr: messageStr,
        signedMsgStruct: {
          signedMsgHex: signedMsgHex,
          recoveryBit: signedMsg.recovery
        }
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
