import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "../../firebase/userService";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
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

  if (loading) return <div className="admin-loading">Loading users…</div>;

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-hd">
          <h3>Users ({users.length})</h3>
          <input className="admin-search" placeholder="Search name / email…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><span>👥</span><p>No users found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Change Role</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.uid}>
                  <td><strong>{u.name}</strong></td>
                  <td style={{color:"#6B4C38"}}>{u.email}</td>
                  <td><span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-customer"}`}>{u.role}</span></td>
                  <td style={{fontSize:".78rem",color:"#6B4C38"}}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={u.role}
                      onChange={e => handleRole(u.uid, e.target.value)}
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{background:"#FFF5E6",border:"1.5px solid #F0BB50",borderRadius:10,padding:"14px 18px",fontSize:".85rem",color:"#7B4F2E"}}>
        <strong>💡 Tip:</strong> To make yourself an admin, sign up normally then change your role here to <strong>admin</strong>.
        You'll need to log out and back in for the change to take effect.
      </div>
    </div>
  );
}
