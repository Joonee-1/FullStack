import { useEffect, useState } from "react";
import axios from "axios";

export default function Profile({ token, username, goBack }) {
  const [profile, setProfile] = useState(null);
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/profile?token=${token}`)
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null));
  }, [token]);

  const updatePass = async () => {
    // Vulnerable demo action — keep same logic but change to username
    await axios.post(`${process.env.REACT_APP_API_URL}/admin/modify_balance`, {
      username,
      balance: profile.balance
    });

    alert("Profile update simulated (vulnerable).");
  };

  return (
    <div className="card">
      <h3>Profile</h3>

      {profile ? (
        <>
          <div className="small">Name: {profile.name}</div>
          <div className="small">Username: {profile.username}</div>
          <div className="small">Account: {profile.account_no}</div>
          <div className="small">Balance: RM {profile.balance}</div>
        </>
      ) : (
        <div>Loading...</div>
      )}

      <div style={{ marginTop: 12 }}>
        <input
          className="input"
          placeholder="New password"
          onChange={(e) => setNewPass(e.target.value)}
        />
        <button className="button" onClick={updatePass}>Update (insecure)</button>

        <button
          className="button"
          onClick={goBack}
          style={{ background: "#eee", color: "#000", marginLeft: 8 }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
