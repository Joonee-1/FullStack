// src/pages/FD.js
import { useState, useEffect } from "react";
import axios from "axios";

export default function FD({ token, email, goBack, onActionComplete }) {
  const [fdList, setFdList] = useState([]);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(1);
  const [fdType, setFdType] = useState("conventional");
  const [interestOption, setInterestOption] = useState("withdraw");
  const [loading, setLoading] = useState(false);

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

  const fetchFD = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/fd/list/${email}`);
      setFdList(res.data || []);
    } catch (err) {
      console.error(err);
      setFdList([]);
    }
  };

  useEffect(() => {
    fetchFD();
  }, [email]);

  const createFD = async () => {
    const amt = Number(amount);
    const dur = Number(duration);

    if (!amt || amt <= 0) return alert("Enter a valid amount");
    if (!dur || dur < 1 || dur > 12) return alert("Enter valid duration (1-12 months)");

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/fd/create`, {
        username: email,
        amount: amt,
        duration_months: dur,
        fd_type: fdType,
        interest_option: interestOption
      });

      if (res.data.error) {
        alert(res.data.error);
      } else {
        alert("FD created successfully!");
        setAmount("");
        setDuration(1);
        setFdType("conventional");
        setInterestOption("withdraw");
        fetchFD();
        if (onActionComplete) onActionComplete(); // <-- refresh statement
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create FD");
    } finally {
      setLoading(false);
    }
  };

  const withdrawFD = async (fd_id) => {
    if (!confirm("Withdraw FD? Principal + interest will be added to your balance.")) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/fd/withdraw`, { fd_id });
      if (res.data.error) alert(res.data.error);
      else {
        alert(`FD withdrawn!\nPrincipal: RM${res.data.principal}\nInterest: RM${res.data.interest.toFixed(2)}\nTotal: RM${res.data.total.toFixed(2)}`);
        fetchFD();
        if (onActionComplete) onActionComplete(); // <-- refresh statement
      }
    } catch (err) {
      console.error(err);
      alert("Failed to withdraw FD");
    }
  };

  const cancelFD = async (fd_id) => {
    if (!confirm("Cancel FD? Only principal will be refunded.")) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/fd/cancel`, { fd_id });
      if (res.data.error) alert(res.data.error);
      else {
        alert(`FD cancelled. Principal refunded: RM${res.data.principal}`);
        fetchFD();
        if (onActionComplete) onActionComplete(); // <-- refresh statement
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel FD");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 20 }}>
      <h2>Fixed Deposits</h2>

      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          className="input"
          placeholder="Amount (RM)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%" }}
        />

        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="input"
          style={{ width: "100%" }}
        >
          {MONTHS.map(m => (
            <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>
          ))}
        </select>

        <select
          value={fdType}
          onChange={(e) => setFdType(e.target.value)}
          className="input"
          style={{ width: "100%" }}
        >
          <option value="conventional">Conventional FD</option>
          <option value="islamic">Islamic FD (profit)</option>
        </select>

        <select
          value={interestOption}
          onChange={(e) => setInterestOption(e.target.value)}
          className="input"
          style={{ width: "100%" }}
        >
          <option value="withdraw">Withdraw interest to account</option>
          <option value="compound">Compound interest (add to principal)</option>
        </select>

        <button className="button" onClick={createFD} disabled={loading}>
          {loading ? "Creating..." : "Create FD"}
        </button>

        <button className="button" onClick={goBack} style={{ background: "#eee", color: "#000" }}>
          Back
        </button>
      </div>

      <h4>Your FDs</h4>
      <table className="table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Type</th>
            <th>Interest Rate</th>
            <th>Duration</th>
            <th>Maturity</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {fdList.length === 0 ? (
            <tr><td colSpan="7" className="small">No FDs found.</td></tr>
          ) : fdList.map(fd => {
            const matured = Date.now() / 1000 >= fd.maturity_time;
            const statusLabel = fd.status === "active" ? (matured ? "Active (Matured)" : "Active") : fd.status.charAt(0).toUpperCase() + fd.status.slice(1);

            return (
              <tr key={fd._id}>
                <td>RM {fd.amount}</td>
                <td style={{ textTransform: "capitalize" }}>{fd.fd_type}</td>
                <td>{(fd.interest_rate * 100).toFixed(2)}%</td>
                <td>{fd.duration_months} {fd.duration_months === 1 ? "month" : "months"}</td>
                <td>{new Date(fd.maturity_time * 1000).toLocaleDateString()}</td>
                <td>{statusLabel}</td>
                <td>
                  {fd.status === "active" && matured ? (
                    <button className="button small" onClick={() => withdrawFD(fd._id)}>Withdraw</button>
                  ) : fd.status === "active" ? (
                    <button className="button small" onClick={() => cancelFD(fd._id)}>Cancel</button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
