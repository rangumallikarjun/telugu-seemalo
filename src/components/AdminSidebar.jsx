import { logout } from "../firebase/authService";

const LINKS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "reports",   icon: "📈", label: "Reports" },
  { id: "orders",    icon: "📦", label: "Orders" },
  { id: "products",  icon: "🏺", label: "Products" },
  { id: "customers", icon: "👥", label: "Customers" },
  { id: "reviews",   icon: "⭐", label: "Reviews" },
  { id: "support",   icon: "💬", label: "Support" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "coupons",   icon: "🎟️", label: "Coupons" },
  { id: "shipping",  icon: "🚚", label: "Shipping" },
  { id: "payments",  icon: "💳", label: "Payments" },
  { id: "returns",   icon: "↩",  label: "Returns" },
  { id: "settings",  icon: "⚙️", label: "Settings" },
];

export default function AdminSidebar({tab, setTab, user, setUser, setPage}) {
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setPage("home");
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-logo">
        <h2>Telugu Seemalo</h2>
        <p>Admin Panel</p>
      </div>

      <nav className="admin-nav">
        {LINKS.map(l => (
          <button
            key={l.id}
            className={`admin-nav-item ${tab === l.id ? "active" : ""}`}
            onClick={() => setTab(l.id)}
          >
            <span className="icon">{l.icon}</span>
            {l.label}
          </button>
        ))}
        <div className="admin-nav-sep"/>
        <button className="admin-nav-item" onClick={() => setPage("home")}>
          <span className="icon">🛍️</span>
          Back to Store
        </button>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          Logged in as<span>{user?.name || user?.email}</span>
        </div>
        <button className="admin-nav-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
