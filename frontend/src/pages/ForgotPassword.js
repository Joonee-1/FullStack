import { useState } from "react";
import axios from "axios";

export default function ForgotPassword({ goLogin }) {
  const [username,setUsername] = useState("");
  const [result,setResult] = useState(null);

  const doForgot = async () => {
    try {
      const r = await axios.post(`${process.env.REACT_APP_API_URL}/forgot`, { username });
      setResult(r.data);
    } catch(e) {
      alert("Error recovering password");
    }
  };

  return (
    <div className="card" style={{maxWidth:700, margin:'20px auto'}}>
      <h2>Forgot Password (VULNERABLE)</h2>
      <input className="input" placeholder="Your username" onChange={e=>setUsername(e.target.value)} />
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button className="button" onClick={doForgot}>Recover</button>
        <button className="button" onClick={goLogin} style={{background:'#eee', color:'#000'}}>Back</button>
      </div>
      {result && <pre style={{marginTop:12}}>{JSON.stringify(result,null,2)}</pre>}
    </div>
  )
}
