import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin({ goBack }) {
  const [users,setUsers] = useState([]);
  const [txs,setTxs] = useState([]);

  useEffect(()=> {
    axios.get(`${process.env.REACT_APP_API_URL}/admin/users`).then(r=>setUsers(r.data)).catch(()=>setUsers([]));
    axios.get(`${process.env.REACT_APP_API_URL}/admin/transactions`).then(r=>setTxs(r.data)).catch(()=>setTxs([]));
  },[]);

  const modifyBalance = async (username) => {
    const newbal = prompt("New balance for " + username);
    await axios.post(`${process.env.REACT_APP_API_URL}/admin/modify_balance`, { username, balance: newbal });
    alert("Modified (insecure)");
  };

  return (
    <div>
      <div className="card">
        <h3>Admin - Users (OPEN)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Password</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.balance}</td>
                <td>{u.password}</td>
                <td>
                  <button className="button" onClick={()=>modifyBalance(u.username)}>Modify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Admin - Transactions</h3>
        <pre>{JSON.stringify(txs,null,2)}</pre>
      </div>

      <button className="button" onClick={goBack}>Back</button>
    </div>
  );
}
