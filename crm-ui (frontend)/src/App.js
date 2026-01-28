import * as XLSX from "xlsx";
import React, { useState, useEffect } from "react";

/* ================= DATE FORMAT ================= */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/* ================= MAIN APP ================= */

export default function CRMApp() {

  const [isAuth, setIsAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState("upload");
  const [records, setRecords] = useState([]);
  const [menuOpen, setMenuOpen] = useState(true);

  /* ================= LOAD INITIAL RECORDS ================= */

  useEffect(() => {

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    if (!userId) return;

    setIsAdmin(role === "admin");

    const url =
      role === "admin"
        ? "http://localhost:5000/records"
        : `http://localhost:5000/records/${userId}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setRecords(data));

  }, []);

  /* ================= FILTER BY DATE ================= */

  const loadByDate = (date) => {

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    fetch(`http://localhost:5000/records-by-date?date=${date}&userId=${userId}&role=${role}`)
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(err => console.error(err));
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
  };

  if (!isAuth) {
    return (
      <Login onLogin={(role) => {
        setIsAuth(true);
        setIsAdmin(role === "admin");
      }} />
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>

      {/* SIDEBAR */}

      <div style={{
        width: menuOpen ? 220 : 0,
        background: "#0f172a",
        color: "#fff",
        padding: menuOpen ? 20 : 0,
        transition: "0.3s"
      }}>

       <h2>CRM</h2>

{isAdmin && (
  <div style={{ 
    margin: "10px 0 20px 0", 
    padding: "6px 10px",
    background: "#1e293b",
    borderRadius: 6,
    fontSize: 13,
    opacity: 0.8
  }}>
    👑 Admin Mode
  </div>
)}

<Nav label="Productivity" setPage={setPage} page="upload" />
<Nav label="Records" setPage={setPage} page="records" />


        <Nav label="Logout" setPage={logout} />

      </div>

      {/* CONTENT */}

      <div style={{ flex: 1, padding: 20 }}>
        <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>

        {page === "upload" && <Upload setRecords={setRecords} />}
        {page === "records" && (
          <Records 
            records={records} 
            loadByDate={loadByDate} 
          />
        )}
      </div>

    </div>
  );
}

/* ================= NAV ================= */

function Nav({ label, setPage, page }) {
  return (
    <div
      onClick={() => setPage(page || label.toLowerCase())}
      style={{ margin: 10, cursor: "pointer" }}
    >
      {label}
    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ onLogin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {

    fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {

        if (!data.success) {
          alert("Invalid login");
          return;
        }

        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("name", data.user.name);

        onLogin(data.user.role);
      });
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      background: "#4f46e5"
    }}>

      <div style={{ background: "#fff", padding: 40, borderRadius: 10, width: 300 }}>

        <h2>CRM Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={input}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={input}
        />

        <button onClick={login} style={btn}>Login</button>

      </div>
    </div>
  );
}

/* ================= UPLOAD ================= */

function Upload({ setRecords }) {

  const [date, setDate] = useState("");
  const [task, setTask] = useState("");

  const submit = () => {

    if (!date || !task) return alert("Fill all fields");

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    fetch("http://localhost:5000/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, task, userId })
    })
    .then(() => {

      const url =
        role === "admin"
          ? "http://localhost:5000/records"
          : `http://localhost:5000/records/${userId}`;

      fetch(url)
        .then(res => res.json())
        .then(data => setRecords(data));

      setDate("");
      setTask("");
    });
  };

  return (
    <div style={recordsContainer}>

      <h2 style={titleStyle}>Daily Productivity</h2>

      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={modernInput} />

      <textarea
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="What did you work on today?"
        rows={4}
        style={modernInput}
      />

      <button onClick={submit} style={modernBtn}>
        Submit Productivity
      </button>

    </div>
  );
}

/* ================= RECORDS ================= */

function Records({ records, loadByDate }) {

  const [selectedDate, setSelectedDate] = useState("");

  const exportExcel = () => {

    if (!records.length) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Productivity");

    XLSX.writeFile(workbook, "productivity_records.xlsx");
  };

  return (
    <div style={recordsContainer}>

      <h2 style={titleStyle}>Productivity Records</h2>

      <div style={filterBar}>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={modernInput}
        />

        <button
          onClick={() => loadByDate(selectedDate)}
          style={modernBtn}
        >
          Load Records
        </button>

      </div>

      <button style={excelBtn} onClick={exportExcel}>
        Export to Excel
      </button>

      <div style={tableWrapper}>

        <table style={modernTable}>

          <thead>
            <tr>
              <th>User</th>
              <th>Date</th>
              <th>Task</th>
            </tr>
          </thead>

          <tbody>

            {records.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: 20, textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            )}

            {records.map((r, i) => (
              <tr key={i}>
                <td>{r.name || "You"}</td>
                <td>{formatDate(r.date)}</td>
                <td>{r.task}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10
};

const btn = {
  width: "100%",
  padding: 10,
  background: "#4f46e5",
  color: "#fff",
  border: "none"
};

// Productivity page styles
const modernInput = {
  width: "100%",
  padding: "14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 16,
  marginBottom: 14
};

const modernBtn = {
  padding: "14px",
  borderRadius: 12,
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  background: "#4f46e5",
  color: "#fff",
  marginBottom: 20
};

// Records page styles
const recordsContainer = {
  maxWidth: 900,
  margin: "40px auto",
  background: "#fff",
  padding: 30,
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
};

const titleStyle = {
  fontSize: 24,
  marginBottom: 20
};

const filterBar = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10
};

const excelBtn = {
  padding: "10px 16px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginBottom: 20
};

const tableWrapper = {
  overflowX: "auto"
};

const modernTable = {
  width: "100%",
  borderCollapse: "collapse"
};
