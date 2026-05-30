export default function Toast({msg, type}) {
  if (!msg) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast ${type||""}`}>{type==="ok"?"✓":type==="er"?"✕":"ℹ"} {msg}</div>
    </div>
  );
}
