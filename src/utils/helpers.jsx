// Inserts Cloudinary auto-format/auto-quality + a max width into an upload URL,
// so large source photos aren't served at full resolution over the wire.
export const cldOptimize = (url, width) => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const transform = `f_auto,q_auto${width ? `,w_${width}` : ""}`;
  return url.replace("/upload/", `/upload/${transform}/`);
};

export const fmt = n => "₹" + n.toLocaleString("en-IN");
export const disc = (p, o) => Math.round((1 - p / o) * 100);
export function Stars({r}) {
  return <><span className="stars">{"★".repeat(Math.floor(r))}{"☆".repeat(5-Math.floor(r))}</span></>;
}

// Generic "no photo" placeholder — used anywhere a product image is missing.
export function NoImageIcon({ size = "45%", style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: .3, flexShrink: 0, ...style }}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  );
}

// Renders a product's photo if present, otherwise the generic placeholder.
export function ProductThumbImg({ src, name, iconSize }) {
  return src
    ? <img src={src} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
    : <NoImageIcon size={iconSize}/>;
}
