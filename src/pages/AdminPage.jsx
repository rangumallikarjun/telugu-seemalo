import { useState } from "react";
import AS from "../styles/adminStyles";
import AdminSidebar from "../components/AdminSidebar";
import AdminDashboard from "./admin/AdminDashboard";
import AdminReports from "./admin/AdminReports";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminCustomers from "./admin/AdminCustomers";
import AdminCoupons from "./admin/AdminCoupons";
import AdminShipping from "./admin/AdminShipping";
import AdminPayments from "./admin/AdminPayments";
import AdminSettings from "./admin/AdminSettings";
import AdminReturns from "./admin/AdminReturns";
import AdminReviews from "./admin/AdminReviews";
import AdminSupport from "./admin/AdminSupport";
import AdminNotifications from "./admin/AdminNotifications";

const TAB_TITLES = {
  dashboard: "Dashboard",
  reports:   "Reports",
  orders:    "Orders",
  products:  "Products",
  customers: "Customers",
  reviews:   "Reviews",
  support:       "Support Tickets",
  notifications: "Notifications",
  coupons:   "Coupons",
  shipping:  "Shipping",
  payments:  "Payments",
  returns:   "Returns & Exchanges",
  settings:  "Settings",
};

export default function AdminPage({user, setUser, setPage}) {
  const [tab, setTab] = useState("dashboard");

  if (!user || user.role !== "admin") {
    return (
      <div style={{textAlign:"center",padding:"100px 20px"}}>
        <div style={{fontSize:"3rem",marginBottom:16}}>🔒</div>
        <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.8rem",marginBottom:10}}>Admin Access Only</h2>
        <p style={{color:"#6B4C38",marginBottom:24}}>
          {user ? "Your account does not have admin privileges." : "Please log in with an admin account."}
        </p>
        <button className="btn-sf" onClick={() => setPage("home")}>← Back to Store</button>
      </div>
    );
  }

  return (
    <>
      <style>{AS}</style>
      <div className="admin-wrap">
        <AdminSidebar tab={tab} setTab={setTab} user={user} setUser={setUser} setPage={setPage}/>
        <div className="admin-main">
          <div className="admin-topbar">
            <h1>{TAB_TITLES[tab]}</h1>
            <div className="admin-topbar-right">
              <span>👤 {user.name || user.email}</span>
              <span style={{padding:"4px 10px",background:"rgba(232,98,10,.1)",color:"#E8620A",borderRadius:8,fontSize:".75rem",fontWeight:700}}>ADMIN</span>
            </div>
          </div>

          {tab === "dashboard" && <AdminDashboard/>}
          {tab === "reports"   && <AdminReports/>}
          {tab === "orders"    && <AdminOrders/>}
          {tab === "products"  && <AdminProducts/>}
          {tab === "customers" && <AdminCustomers/>}
          {tab === "reviews"   && <AdminReviews/>}
          {tab === "support"        && <AdminSupport/>}
          {tab === "notifications"  && <AdminNotifications/>}
          {tab === "coupons"   && <AdminCoupons/>}
          {tab === "shipping"  && <AdminShipping/>}
          {tab === "payments"  && <AdminPayments/>}
          {tab === "returns"   && <AdminReturns/>}
          {tab === "settings"  && <AdminSettings/>}
        </div>
      </div>
    </>
  );
}
