import { useState } from "react";
import "./App.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import Bills from "./pages/Bills";
import Cards from "./pages/Cards";
import Notifications from "./pages/Notifications";
import Statements from "./pages/Statements";
import FD from "./pages/FD";  // ← import FD page

export default function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "user");

  const loginSuccess = (token, username, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("role", role);
    setToken(token);
    setUsername(username);
    setRole(role);
    setPage("dashboard");
  };

  const logout = () => {
    localStorage.clear();
    setToken("");
    setUsername("");
    setRole("user");
    setPage("login");
  };

  return (
    <>
      <div className="header">
        <div className="logo">VulnBank</div>
        <div className="topinfo">
          {username ? `Acct: ${localStorage.getItem("acct_no") || "—"}` : ""}
        </div>
      </div>
      <div className="container">
        {page === "register" && <Register goLogin={() => setPage("login")} />}
        {page === "login" && (
          <Login
            onSuccess={loginSuccess}
            goRegister={() => setPage("register")}
            goForgot={() => setPage("forgot")}
          />
        )}
        {page === "forgot" && <ForgotPassword goLogin={() => setPage("login")} />}

        {page === "dashboard" && (
          <Dashboard
            token={token}
            username={username}
            role={role}
            logout={logout}
            goTransfer={() => setPage("transfer")}
            goHistory={() => setPage("history")}
            goProfile={() => setPage("profile")}
            goAdmin={() => setPage("admin")}
            goSupport={() => setPage("support")}
            goBills={() => setPage("bills")}
            goCards={() => setPage("cards")}
            goNotifications={() => setPage("notifications")}
            goStatements={() => setPage("statements")}
            goFD={() => setPage("fd")}  // ← FD navigation fixed
          />
        )}

        {page === "transfer" && <Transfer token={token} username={username} goBack={() => setPage("dashboard")} />}
        {page === "history" && <History username={username} goBack={() => setPage("dashboard")} />}
        {page === "profile" && <Profile token={token} username={username} goBack={() => setPage("dashboard")} />}
        {page === "admin" && <Admin goBack={() => setPage("dashboard")} />}
        {page === "support" && <Support username={username} goBack={() => setPage("dashboard")} />}
        {page === "bills" && <Bills username={username} goBack={() => setPage("dashboard")} />}
        {page === "cards" && <Cards username={username} goBack={() => setPage("dashboard")} />}
        {page === "notifications" && <Notifications username={username} goBack={() => setPage("dashboard")} />}
        {page === "statements" && <Statements username={username} goBack={() => setPage("dashboard")} />}

        {page === "fd" && (
          <FD
            token={token}
            email={username}
            goBack={() => setPage("dashboard")}
          />
        )}
      </div>
    </>
  );
}
