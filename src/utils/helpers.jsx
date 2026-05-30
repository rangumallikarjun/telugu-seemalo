export const fmt = n => "₹" + n.toLocaleString("en-IN");
export const disc = (p, o) => Math.round((1 - p / o) * 100);
export function Stars({r}) {
  return <><span className="stars">{"★".repeat(Math.floor(r))}{"☆".repeat(5-Math.floor(r))}</span></>;
}
