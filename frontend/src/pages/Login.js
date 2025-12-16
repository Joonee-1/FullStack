import { useState } from "react";
import axios from "axios";

export default function Login({ onSuccess, goRegister, goForgot }) {
  const [username,setUsername] = useState("");
  const [pass,setPass] = useState("");

  const doLogin = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/login`, { username, password: pass });
      if (res.data.error) { alert(res.data.error); return; }
      const token = res.data.token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem("token", token);
      localStorage.setItem("username", payload.sub);
      localStorage.setItem("role", payload.role);
      onSuccess(token, payload.sub, payload.role);
    } catch (e) {
      alert("Login error");
    }
  };

  return (
    <div className="card" style={{maxWidth:480, margin:'20px auto'}}>
      <h2>Login</h2>
      <input className="input" placeholder="Username" onChange={e=>setUsername(e.target.value)} />
      <input className="input" placeholder="Password" type="password" onChange={e=>setPass(e.target.value)} />
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button className="button" onClick={doLogin}>Sign in</button>
        <button className="button" onClick={goRegister} style={{background:'#eee', color:'#000'}}>Register</button>
        <button className="button" onClick={goForgot} style={{background:'#fff', color: '#0b6cff'}}>Forgot</button>
      </div>
      {/* <p className="small padded">Demo accounts: <strong>user / user123</strong> and <strong>admin / admin123</strong></p> */}
    </div>
  );
}
