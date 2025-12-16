// src/pages/Statement.js
import { useEffect, useState } from "react";
import axios from "axios";

export default function Statement({ username, goBack }) {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    const fetchStatement = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/statements/${username}/${year}/${month}`
        );
        setStatement(res.data);
      } catch (err) {
        console.error("Failed to load statement", err);
        setStatement({
          opening_balance: 0,
          closing_balance: 0,
          transactions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [username, year, month]);

  if (loading) return <p>Loading statement...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>Monthly Statement – {year}-{String(month).padStart(2, "0")}</h2>

      <p>
        <strong>Opening Balance:</strong>{" "}
        RM {statement.opening_balance.toFixed(2)}
      </p>

      <p>
        <strong>Closing Balance:</strong>{" "}
        RM {statement.closing_balance.toFixed(2)}
      </p>

      <h3>Transactions</h3>

      {statement.transactions.length === 0 ? (
        <p>No transactions this month.</p>
      ) : (
        <table width="100%" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount (RM)</th>
              <th>Balance (RM)</th>
            </tr>
          </thead>
          <tbody>
            {statement.transactions.map((tx, i) => (
              <tr key={i}>
                <td>{new Date(tx.date).toLocaleString()}</td>
                <td>{tx.description}</td>
                <td style={{ color: tx.amount < 0 ? "red" : "green" }}>
                  {tx.amount.toFixed(2)}
                </td>
                <td>{tx.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={goBack} style={{ marginTop: 20 }}>
        Back
      </button>
    </div>
  );
}
