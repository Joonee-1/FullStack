import { useEffect, useState } from "react";
import axios from "axios";

export default function Bills({ email, goBack }) {
  const [list,setList] = useState([]);
  useEffect(()=> {
    axios.get(`process.env.REACT_APP_API_URL/bills/${email}`).then(r=>setList(r.data)).catch(()=>setList([]));
  },[]);
  const pay = async (id) => {
    await axios.post(`${process.env.REACT_APP_API_URL}/pay_bill`, { email, bill_id: id });
    alert("Paid (insecure)");
  };
  return (
    <div className="card">
      <h3>Bills</h3>
      <table className="table">
        <thead><tr><th>Type</th><th>Amount</th><th>Due</th><th>Action</th></tr></thead>
        <tbody>
          {list.map(b => <tr key={b._id}><td>{b.type}</td><td>RM {b.amount}</td><td>{new Date(b.due*1000).toLocaleDateString()}</td><td><button className="button" onClick={()=>pay(b._id)}>Pay</button></td></tr>)}
        </tbody>
      </table>
      <button className="button" onClick={goBack} style={{marginTop:12}}>Back</button>
    </div>
  );
}
