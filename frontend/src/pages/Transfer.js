import { useState, useEffect } from "react";
import axios from "axios";

export default function Transfer({ token, email, goBack, onTransferComplete }) {
  const [fromAcct, setFromAcct] = useState("");
  const [balance, setBalance] = useState(0);
  const [toAcct, setToAcct] = useState("");
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/profile?token=${token}`)
      .then((res) => {
        if (res.data.account_no) setFromAcct(res.data.account_no);
        if (res.data.balance) setBalance(res.data.balance);
      })
      .catch((err) => console.error("Failed to fetch profile:", err));
  }, [token]);

  const doTransfer = async () => {
    if (!toAcct || !toName || !amount) {
      alert("Please fill all required fields.");
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amt > balance) {
      alert("Insufficient balance.");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/transfer`, {
        sender_account: fromAcct,
        receiver_account: toAcct,
        amount: amt,
        description: desc,
      });

      if (res.data.error) {
        alert(`Transfer failed: ${res.data.error}`);
      } else {
        setBalance((prev) => prev - amt);

        // Refresh statement after transfer
        if (onTransferComplete) onTransferComplete();

        alert("Transfer executed. Transaction history updated.");

        setToAcct("");
        setToName("");
        setAmount("");
        setDesc("");
      }
    } catch (err) {
      console.error(err);
      alert("Transfer failed due to network error.");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 500, margin: "20px auto", padding: 20 }}>
      <h3>Make a Transfer</h3>

      <div style={{ marginBottom: 16 }}>
        <label className="small">From Account</label>
        <input className="input" value={fromAcct} readOnly style={{ background: "#f0f0f0", width: "100%" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="small">Balance (RM)</label>
        <input className="input" value={balance.toFixed(2)} readOnly style={{ background: "#f0f0f0", width: "100%" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="small">To Account Number</label>
        <input className="input" placeholder="VulnBank-xxxxx" value={toAcct} onChange={(e) => setToAcct(e.target.value)} style={{ width: "100%" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="small">Account Holder Name (not verified)</label>
        <input className="input" placeholder="Receiver name" value={toName} onChange={(e) => setToName(e.target.value)} style={{ width: "100%" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="small">Amount (RM)</label>
        <input className="input" placeholder="100.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="small">Description</label>
        <input className="input" placeholder="Payment for rent..." value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: "100%" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="button" onClick={doTransfer}>Send</button>
        <button className="button" onClick={goBack} style={{ background: "#eee", color: "#000" }}>Back</button>
      </div>
    </div>
  );
}
