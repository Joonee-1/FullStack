// src/pages/Dashboard.js
import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard({
  token,
  username,
  role,
  logout,
  goTransfer,
  goHistory,
  goProfile,
  goAdmin,
  goSupport,
  goBills,
  goCards,
  goNotifications,
  goStatements,
  goFD
}) {
  const [profile, setProfile] = useState(null);
  const [recent, setRecent] = useState([]);
  const [notes, setNotes] = useState([]);
  const [fds, setFds] = useState([]);

  const decode = (t) => JSON.parse(atob(t.split(".")[1]));
  const user = token ? decode(token).sub : null;

  const loadAll = () => {
    if (!user) return;

    axios.get(`${process.env.REACT_APP_API_URL}/profile?token=${token}`)
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null));

    axios.get(`${process.env.REACT_APP_API_URL}/history/${user}`)
      .then(r => setRecent(r.data))
      .catch(() => setRecent([]));

    axios.get(`${process.env.REACT_APP_API_URL}/notifications/${user}`)
      .then(r => setNotes(r.data))
      .catch(() => setNotes([]));

    axios.get(`${process.env.REACT_APP_API_URL}/fd/list/${user}`)
      .then(r => setFds(r.data))
      .catch(() => setFds([]));
  };

  useEffect(() => {
    loadAll();
  }, [token]);

  const withdrawFD = async (fd_id) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/fd/withdraw`, { fd_id });

      if (res.data.error) {
        alert(res.data.error);
        return;
      }

      alert(
        `FD Withdrawn!\nPrincipal: RM${res.data.principal}\nInterest: RM${res.data.interest.toFixed(
          2
        )}\nTotal: RM${res.data.total.toFixed(2)}`
      );

      loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to withdraw FD");
    }
  };

  return (
    <>
      {/* TOP WELCOME */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3>Welcome back</h3>
          <h2>{profile ? profile.name : username}</h2>
          <div className="small">Account: {profile ? profile.account_no : "—"}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="small">Notifications</div>
          {notes.slice(0, 3).map(n => (
            <div key={n._id} className="small">{n.msg}</div>
          ))}

          <div style={{ marginTop: 10 }}>
            <button className="button" onClick={goProfile}>Profile</button>
            <button className="button" onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* LEFT COLUMN */}
        <div className="col">

          {/* BALANCE */}
          <div className="card">
            <h4>Balance</h4>
            <h1>RM {profile ? profile.balance : "—"}</h1>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="button" onClick={goTransfer}>Transfer</button>
              <button className="button" onClick={goHistory}>History</button>
            </div>
          </div>

          {/* RECENT OUTGOING */}
          <div className="card">
            <h4>Recent outgoing</h4>
            {recent.length === 0 ? (
              <div className="small">No outgoing transactions.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr key={r._id}>
                      <td>{r.to}</td>
                      <td>{r.to_account}</td>
                      <td>RM {r.amount}</td>
                      <td>{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FIXED DEPOSITS – WIDENED */}
          <div className="card" style={{ padding: 20 }}>
            <h4>Fixed Deposits</h4>

            {fds.length === 0 ? (
              <div className="small">No FDs found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Rate</th>
                      <th>Duration</th>
                      <th>Interest Option</th>
                      <th>Maturity</th>
                      <th>Status</th>
                      <th style={{ minWidth: 120 }}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fds.map(fd => {
                      const matured = Date.now() / 1000 >= fd.maturity_time;

                      return (
                        <tr key={fd._id}>
                          <td>RM {fd.amount}</td>
                          <td style={{ textTransform: "capitalize" }}>{fd.fd_type}</td>
                          <td>{(fd.interest_rate * 100).toFixed(2)}%</td>
                          <td>
                            {fd.duration_months}{" "}
                            {fd.duration_months === 1 ? "month" : "months"}
                          </td>
                          <td>{fd.interest_option === "compound" ? "Compound" : "Withdraw"}</td>
                          <td>{new Date(fd.maturity_time * 1000).toLocaleDateString()}</td>
                          <td>
                            {fd.status}
                            {fd.status === "active" && matured ? " (matured)" : ""}
                          </td>
                          <td>
                            {fd.status === "active" && matured ? (
                              <button
                                className="button small"
                                onClick={() => withdrawFD(fd._id)}
                              >
                                Withdraw
                              </button>
                            ) : fd.status === "active" ? (
                              <button
                                className="button small"
                                onClick={async () => {
                                  if (!confirm("Cancel FD? Only principal will be refunded.")) return;
                                  try {
                                    const res = await axios.post(
                                      `${process.env.REACT_APP_API_URL}/fd/cancel`,
                                      { fd_id: fd._id }
                                    );
                                    if (res.data.error) alert(res.data.error);
                                    else {
                                      alert(`FD cancelled. Principal refunded: RM${res.data.principal}`);
                                      loadAll();
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    alert("Failed to cancel FD");
                                  }
                                }}
                              >
                                Cancel
                              </button>
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
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col" style={{ maxWidth: 360 }}>
          <div className="card">
            <h4>Quick actions</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="button" onClick={goTransfer}>New transfer</button>
              <button className="button" onClick={goBills}>Pay bill</button>
              <button className="button" onClick={goCards}>Cards</button>
              <button className="button" onClick={goSupport}>Support</button>
              <button className="button" onClick={goNotifications}>Notifications</button>
              <button className="button" onClick={goStatements}>Statements</button>
              <button className="button" onClick={() => goFD && goFD()}>Fixed Deposits</button>
            </div>
          </div>

          <div className="card">
            <h4>Mini profile</h4>
            <div className="small">Username: {username}</div>
            <div className="small">Role: {role}</div>
            <div className="small">Account: {profile ? profile.account_no : "—"}</div>
          </div>
        </div>
      </div>
    </>
  );
}
