import { useEffect, useState } from "react";
import axios from "axios";
import VirtualCard from "./VirtualCard"; // visual card component

export default function Cards({ username, goBack }) {
  const [cards, setCards] = useState([]);

  // Load cards for this user
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/cards/${username}`)
      .then((r) => setCards(r.data))
      .catch(() => setCards([]));
  }, [username]);

  const create = async () => {
    // Send username to backend, not email
    const r = await axios.post(`${process.env.REACT_APP_API_URL}/cards/create`, { username });
    alert(`Card created: ${r.data.card_no} / CVV ${r.data.cvv} (insecure)`);

    // Refresh the card list
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/cards/${username}`);
    setCards(res.data);
  };

  return (
    <div className="cards-section">
      <h3>My Cards</h3>
      <button className="button" onClick={create}>
        Create Virtual Card
      </button>

      <div className="cards-container" style={{ marginTop: "20px" }}>
        {cards.length === 0 && <p>No virtual cards yet.</p>}
        {cards.map((c) => (
          <VirtualCard key={c._id} card={c} />
        ))}
      </div>

      <button className="button" onClick={goBack} style={{ marginTop: "20px" }}>
        Back
      </button>
    </div>
  );
}
