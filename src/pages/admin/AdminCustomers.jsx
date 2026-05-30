import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "../../firebase/userService";

export default function AdminCustomers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => getAllUsers().then(u => { setUsers(u); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleRole = async (uid, role) => {
    await updateUserRole(uid, role);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading customers…</div>;

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-hd">
          <h3>Customers ({users.length})</h3>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
            <input className="admin-search" placeholder="Search name / email…"
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><span>👥</span><p>No customers found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.uid}>
                  <td><strong>{u.name || "—"}</strong></td>
                  <td style={{fontSize:".85rem",color:"#6B4C38"}}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-delivered" : "badge-processing"}`}>
                      {u.role || "customer"}
                    </span>
                  </td>
                  <td style={{fontSize:".78rem",color:"#6B4C38"}}>
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <select className="status-select" value={u.role || "customer"}
                      onChange={e => handleRole(u.uid, e.target.value)}>
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
