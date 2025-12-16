import { useEffect, useState } from "react";
import axios from "axios";

export default function Notifications({ username, goBack, refreshInterval = 10000 }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/notifications/${username}`);
      setList(res.data);
    } catch (err) {
      setError("Failed to load notifications");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Optional: auto-refresh notifications
    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [username]);

  // Map backend notification types to labels or emojis
  const typeLabel = (type) => {
    switch (type) {
      case "transfer_received": return "💰 Received";
      case "transfer_sent": return "📤 Sent";
      case "fd_created": return "🏦 FD Created";
      case "fd_withdrawn": return "💵 FD Withdrawn";
      case "fd_cancelled": return "❌ FD Cancelled";
      case "bill_payment": return "🧾 Bill Paid";
      default: return "🔔 Info";
    }
  };

  return (
    <div className="card">
      <h3>Notifications</h3>

      {loading && <p>Loading notifications...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && list.length === 0 && !error && <p>No notifications.</p>}

      {!loading && list.length > 0 && (
        <ul>
          {list.map(n => (
            <li key={n._id} style={{ marginBottom: 8 }}>
              <strong>{typeLabel(n.type)}:</strong> {n.msg} <br />
              <small>{new Date(n.time * 1000).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}

      <button className="button" onClick={goBack} style={{ marginTop: 12 }}>
        Back
      </button>
    </div>
  );
}
