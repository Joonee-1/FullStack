import { useState } from "react";
import axios from "axios";

export default function Register({ goLogin }) {
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");

  const doRegister = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/register`, { username, password: pass, name });
    alert("Registered (insecure). Use login.");
    goLogin();
  };

  return (
    <div className="card">
      <h3>Create account</h3>
      <input className="input" placeholder="Full name" onChange={e=>setName(e.target.value)} />
      <input className="input" placeholder="Username" onChange={e=>setUsername(e.target.value)} />
      <input className="input" placeholder="Password" type="password" onChange={e=>setPass(e.target.value)} />
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button className="button" onClick={doRegister}>Register</button>
        <button className="button" onClick={goLogin} style={{background:'#ccc', color:'#000'}}>Back</button>
      </div>
    </div>
  );
}
