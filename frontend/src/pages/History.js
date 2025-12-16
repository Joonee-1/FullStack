import { useEffect, useState } from "react";
import axios from "axios";

export default function History({ username, goBack }) {
  const [list,setList] = useState([]);

  useEffect(()=> {
    if (!username) return;
    axios.get(`${process.env.REACT_APP_API_URL}/history/${username}`)
      .then(r=>setList(r.data))
      .catch(()=>setList([]));
  }, [username]);

  return (
    <div className="card">
      <h3>Transaction History (outgoing)</h3>
      {list.length === 0 ? <div className="small">No transactions</div> :
        <table className="table">
          <thead>
            <tr><th>Date</th><th>To</th><th>Account</th><th>Amount</th><th>Desc</th></tr>
          </thead>
          <tbody>
            {list.map(l => (
              <tr key={l._id}>
                <td>{new Date(l.time*1000).toLocaleString()}</td>
                <td>{l.to}</td>
                <td>{l.to_account}</td>
                <td>RM {l.amount}</td>
                <td>{l.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      <div style={{marginTop:12}}>
        <button className="button" onClick={goBack}>Back</button>
      </div>
    </div>
  );
}
