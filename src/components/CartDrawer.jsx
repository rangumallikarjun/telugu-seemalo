import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { fmt, NoImageIcon } from "../utils/helpers";

export default function CartDrawer({cart, open, onClose, onQty, onRemove, setPage}) {
  const [freeAbove, setFreeAbove] = useState(null);
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);

  useEffect(() => {
    getDoc(doc(db, "settings", "shipping"))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.enableFreeShipping && d.freeAbove) setFreeAbove(d.freeAbove);
        }
      })
      .catch(() => {});
  }, []);

  const freeProgress = freeAbove ? Math.min(100, (total / freeAbove) * 100) : 0;
  const remaining    = freeAbove ? Math.max(0, freeAbove - total) : 0;

  return (
    <>
      <div className={`cart-overlay ${open?"open":""}`} onClick={onClose}/>
      <div className={`cart-drawer ${open?"open":""}`}>
        <div className="cart-hd">
          <h3>Your Cart ({cart.reduce((s,i)=>s+i.qty,0)})</h3>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {freeAbove && cart.length > 0 && (
          <div className="fs-bar-wrap">
            {remaining === 0
              ? <div className="fs-msg fs-done">🎉 Free shipping unlocked!</div>
              : <div className="fs-msg">Add <strong>{fmt(remaining)}</strong> more for free shipping</div>
            }
            <div className="fs-bar-track">
              <div className="fs-bar-fill" style={{ width: `${freeProgress}%` }}/>
            </div>
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0
            ? <div className="cart-empty"><span>🛒</span><p>Your cart is empty</p></div>
            : cart.map(item => (
                <div key={item.cartId} className="ci">
                  <div className="ci-img">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <NoImageIcon/>}
                  </div>
                  <div className="ci-info">
                    <div className="ci-name">{item.name}</div>
                    <div className="ci-opt">{[item.selSize, item.selColor].filter(Boolean).join(" · ")}</div>
                    <div className="ci-row">
                      <div className="ci-qty">
                        <button onClick={() => onQty(item.cartId, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => onQty(item.cartId, item.qty + 1)}>+</button>
                      </div>
                      <span className="ci-price">{fmt(item.price * item.qty)}</span>
                    </div>
                    <button className="ci-del" onClick={() => onRemove(item.cartId)}>Remove</button>
                  </div>
                </div>
              ))
          }
        </div>

        {cart.length > 0 && (
          <div className="cart-ft">
            <div className="cart-total"><span>Subtotal</span><span>{fmt(total)}</span></div>
            <button className="checkout-btn" onClick={() => { onClose(); setPage("checkout"); }}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
