import { useState } from "react";
import axios from "axios";

export default function Support({ email, goBack }) {
  const [sub, setSub] = useState("");
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState([]);

  const create = async () => {
    const res = await axios.post("${process.env.REACT_APP_API_URL}/support/create", { email, subject: sub, message: msg});
    alert("Ticket created: " + res.data.ticket_id);
    const list = await axios.get(`${process.env.REACT_APP_API_URL}/support/list/${email}`);
    setTickets(list.data);
  };

  return (
    <div className="card">
      <h3>Support</h3>
      <input className="input" placeholder="Subject" onChange={e=>setSub(e.target.value)} />
      <textarea className="input" placeholder="Message" style={{height:120}} onChange={e=>setMsg(e.target.value)} />
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button className="button" onClick={create}>Create Ticket</button>
        <button className="button" onClick={async ()=>{ const list = await axios.get(`process.env.REACT_APP_API_URL/support/list/${email}`); setTickets(list.data);}}>Load Tickets</button>
        <button className="button" onClick={goBack} style={{background:'#eee', color:'#000'}}>Back</button>
      </div>
      <div style={{marginTop:12}}>
        <pre>{JSON.stringify(tickets,null,2)}</pre>
      </div>
    </div>
  );
}
