const S = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --sf:#E8620A;--sf2:#FF8C38;--sf3:#CC4E00;
  --gd:#C9901A;--gd2:#F0BB50;
  --dk:#18100A;--dk2:#2D1E12;
  --cr:#FDF8F3;--iv:#FFFCF7;
  --mt:#6B4C38;--bd:#E8D5C0;
  --ok:#2D7D46;--er:#C0392B;
  --sh:0 4px 20px rgba(100,60,20,.13);
  --sh2:0 8px 40px rgba(100,60,20,.22);
}
html,body{height:100%;overflow-y:auto !important;}
body{font-family:'DM Sans',sans-serif;background:var(--cr);color:var(--dk);}
.app{min-height:100vh;overflow-y:auto;}

/* NAV */
.nav{background:var(--dk);position:sticky;top:0;z-index:1000;box-shadow:0 2px 20px rgba(0,0,0,.35);}
.nav-in{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:64px;}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;color:var(--gd);cursor:pointer;letter-spacing:.04em;}
.nav-logo span{color:var(--sf);}
.nav-links{display:flex;gap:4px;align-items:center;}
.nbtn{background:none;border:none;color:#C4B49A;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;padding:7px 13px;border-radius:6px;transition:all .2s;letter-spacing:.05em;text-transform:uppercase;}
.nbtn:hover{background:rgba(232,98,10,.18);color:var(--sf2);}
.nbtn.act{background:var(--sf);color:#fff;}
.nav-r{display:flex;align-items:center;gap:10px;}
.cart-btn{background:var(--sf);color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:700;display:flex;align-items:center;gap:6px;transition:all .2s;}
.cart-btn:hover{background:var(--sf3);transform:translateY(-1px);}
.cbadge{background:var(--gd);color:var(--dk);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:900;}

/* HAMBURGER */
.hbg{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:40px;height:40px;cursor:pointer;background:none;border:none;padding:4px;}
.hbg span{display:block;width:22px;height:2px;background:#C4B49A;border-radius:2px;transition:all .3s;}
.hbg.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
.hbg.open span:nth-child(2){opacity:0;transform:scaleX(0);}
.hbg.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}

/* MOBILE DRAWER */
.mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;opacity:0;transition:opacity .3s;}
.mob-overlay.open{display:block;opacity:1;}
.mob-drawer{position:fixed;top:64px;left:0;bottom:0;width:280px;background:var(--dk2);z-index:1000;transform:translateX(-100%);transition:transform .3s ease;overflow-y:auto;padding:20px 0;}
.mob-drawer.open{transform:translateX(0);}
.md-link{display:flex;align-items:center;gap:12px;padding:14px 24px;color:#C4B49A;font-size:.95rem;font-weight:500;cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all .2s;border-left:3px solid transparent;}
.md-link:hover,.md-link.act{color:var(--sf2);background:rgba(232,98,10,.1);border-left-color:var(--sf);}
.md-sep{height:1px;background:rgba(255,255,255,.08);margin:12px 24px;}
.md-auth{display:flex;flex-direction:column;gap:10px;padding:16px 24px;}
.md-auth-btn{padding:10px;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer;transition:all .2s;}
.md-login{background:none;border:1.5px solid var(--sf);color:var(--sf);}
.md-signup{background:var(--sf);border:none;color:#fff;}

@media(max-width:768px){
  .nav-links{display:none;}
  .hbg{display:flex;}
  .hero{min-height:calc(100svh - 64px);padding:48px 20px;}
}
@media(min-width:769px){.mob-overlay,.mob-drawer{display:none!important;}}

/* HERO */
.hero{background:linear-gradient(135deg,#18100A 0%,#2D1E12 50%,#3D2415 100%);color:#fff;min-height:calc(100vh - 64px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;position:relative;overflow:hidden;box-sizing:border-box;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 60% 50%,rgba(232,98,10,.12) 0%,transparent 60%);pointer-events:none;}
.hero-tel{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--gd2);letter-spacing:.25em;text-transform:uppercase;margin-bottom:12px;display:block;}
.hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(2.2rem,5vw,3.8rem);font-weight:700;line-height:1.15;margin-bottom:18px;}
.hero h1 em{font-style:normal;}
.hero p{font-size:1.05rem;color:#BFB09A;max-width:520px;margin:0 auto 28px;line-height:1.7;}
.hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
.btn-sf{background:var(--sf);color:#fff;border:none;padding:12px 28px;border-radius:24px;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .22s;letter-spacing:.04em;}
.btn-sf:hover{background:var(--sf3);transform:translateY(-2px);box-shadow:0 6px 24px rgba(232,98,10,.4);}
.btn-out{background:none;border:1.5px solid var(--gd);color:var(--gd);padding:12px 28px;border-radius:24px;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .22s;}
.btn-out:hover{background:rgba(201,144,26,.12);transform:translateY(-2px);}
.gi-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(201,144,26,.15);border:1.5px solid var(--gd);color:var(--gd2);padding:5px 14px;border-radius:20px;font-size:.78rem;font-weight:600;letter-spacing:.06em;margin-top:18px;}

/* ── Shimmer text ── */
@keyframes shimmer-sweep{0%{background-position:-300% center}100%{background-position:300% center}}
.shimmer-txt{background:linear-gradient(90deg,#C9901A 0%,#C9901A 34%,#FFF9D0 45%,#FFE878 50%,#FFF9D0 55%,#C9901A 66%,#C9901A 100%);background-size:300% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:shimmer-sweep 6s linear infinite;font-style:normal;}

/* ── Typewriter ── */
.tw-wrap{min-height:1.5rem;margin:2px 0 16px;}
.tw-line{font-size:.95rem;color:rgba(191,176,154,.88);font-style:italic;letter-spacing:.02em;}
.tw-cursor{display:inline-block;width:2px;height:.88em;background:#E8620A;margin-left:3px;vertical-align:middle;animation:tw-blink .72s step-end infinite;}
@keyframes tw-blink{0%,100%{opacity:1}50%{opacity:0}}

/* ── Mandala spin ── */
@keyframes spin-cw{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes spin-ccw{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}

/* TRUST STRIP */
.trust{background:var(--dk2);padding:16px 20px;display:flex;justify-content:center;gap:clamp(16px,4vw,48px);flex-wrap:wrap;}
.trust-item{display:flex;align-items:center;gap:8px;color:#BFB09A;font-size:.8rem;font-weight:500;}
.trust-item span:first-child{font-size:1.1rem;}

/* SECTION */
.sec{max-width:1200px;margin:0 auto;padding:60px 20px;}
.sec-hd{text-align:center;margin-bottom:40px;}
.sec-hd h2{font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:700;color:var(--dk);margin-bottom:10px;}
.sec-hd p{color:var(--mt);font-size:1rem;max-width:500px;margin:0 auto;}
.divider{width:60px;height:3px;background:linear-gradient(90deg,var(--sf),var(--gd));margin:12px auto;}

/* CATEGORY PILLS */
.cat-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:36px;}
.cpill{padding:8px 20px;border-radius:20px;border:1.5px solid var(--bd);background:#fff;color:var(--mt);font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s;}
.cpill:hover{border-color:var(--sf);color:var(--sf);}
.cpill.act{background:var(--sf);border-color:var(--sf);color:#fff;}

/* PRODUCT GRID */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:24px;}
@media(max-width:560px){.pgrid{grid-template-columns:repeat(2,1fr);gap:14px;}}

/* PRODUCT CARD */
.pcard{background:#fff;border-radius:14px;overflow:hidden;box-shadow:var(--sh);transition:all .25s;cursor:pointer;position:relative;}
.pcard:hover{transform:translateY(-4px);box-shadow:var(--sh2);}
.pcard-img{height:180px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);overflow:hidden;position:relative;}
.pcard-img img{transition:transform .55s ease;}
.pcard:hover .pcard-img img{transform:scale(1.09);}
.pcard-heart{position:absolute;top:8px;left:8px;z-index:2;background:rgba(255,255,255,.9);border:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;transition:all .2s;box-shadow:0 1px 6px rgba(0,0,0,.12);line-height:1;color:#C4B49A;}
.pcard-heart:hover{transform:scale(1.15);background:#fff;}
.pcard-heart.act{color:#E8620A;}
.pcard-urgency{position:absolute;bottom:8px;left:0;right:0;text-align:center;background:rgba(192,57,43,.88);color:#fff;font-size:.65rem;font-weight:700;padding:3px 8px;letter-spacing:.04em;pointer-events:none;}
.pcard-body{padding:14px;}
.pcard-cat{font-size:.72rem;font-weight:700;color:var(--sf);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
.pcard-name{font-family:'Cormorant Garamond',serif;font-size:1.08rem;font-weight:600;line-height:1.35;margin-bottom:8px;color:var(--dk);}
.pcard-stars{display:flex;align-items:center;gap:5px;margin-bottom:8px;}
.stars{color:#F0BB50;font-size:.82rem;}
.rv{font-size:.76rem;color:var(--mt);}
.pcard-price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}
.price{font-size:1.15rem;font-weight:700;color:var(--dk);}
.oprice{font-size:.85rem;color:var(--mt);text-decoration:line-through;}
.disc{font-size:.75rem;font-weight:700;color:var(--ok);background:#E8F5EC;padding:2px 7px;border-radius:10px;}
.pcard-add{width:100%;margin-top:12px;background:var(--sf);color:#fff;border:none;padding:9px;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s;}
.pcard-add:hover{background:var(--sf3);}
.new-badge{position:absolute;top:10px;right:10px;background:var(--sf);color:#fff;font-size:.68rem;font-weight:800;padding:3px 9px;border-radius:10px;letter-spacing:.06em;}
.sold-out{opacity:.6;}
.sold-out .pcard-add{background:#aaa;cursor:not-allowed;}

/* Recently Viewed */
.rv-strip{margin-top:32px;padding-top:28px;border-top:1px solid var(--bd);}
.rv-strip h4{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:700;color:var(--dk);margin-bottom:14px;}
.rv-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent;}
.rv-scroll::-webkit-scrollbar{height:4px;}.rv-scroll::-webkit-scrollbar-thumb{background:var(--bd);border-radius:4px;}
.rv-card{flex:0 0 128px;border-radius:10px;background:#fff;box-shadow:var(--sh);cursor:pointer;overflow:hidden;transition:transform .2s;border:1.5px solid transparent;}
.rv-card:hover{transform:translateY(-3px);border-color:var(--sf);}
.rv-img{height:86px;display:flex;align-items:center;justify-content:center;font-size:2.2rem;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);overflow:hidden;}
.rv-img img{width:100%;height:100%;object-fit:cover;}
.rv-info{padding:7px 8px;}
.rv-name{font-size:.72rem;font-weight:600;color:var(--dk);line-height:1.35;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.rv-price{font-size:.76rem;font-weight:700;color:var(--sf);}

/* Wishlist Grid (profile) */
.wl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:16px;}
.wl-card{border-radius:10px;border:1.5px solid var(--bd);overflow:hidden;cursor:pointer;transition:all .2s;}
.wl-card:hover{border-color:var(--sf);transform:translateY(-2px);}
.wl-img{height:88px;display:flex;align-items:center;justify-content:center;font-size:2.2rem;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);overflow:hidden;position:relative;}
.wl-img img{width:100%;height:100%;object-fit:cover;}
.wl-rm{position:absolute;top:4px;right:4px;background:rgba(255,255,255,.9);border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center;color:#C0392B;transition:all .2s;line-height:1;}
.wl-rm:hover{background:#fff;transform:scale(1.15);}
.wl-body{padding:7px 9px;}
.wl-name{font-size:.74rem;font-weight:600;color:var(--dk);line-height:1.3;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.wl-price{font-size:.78rem;font-weight:700;color:var(--sf);}

/* PRODUCT DETAIL PAGE */
.pd-wrap{max-width:1100px;margin:0 auto;padding:32px 20px;}
.pd-back{display:flex;align-items:center;gap:7px;background:none;border:none;color:var(--sf);font-size:.9rem;font-weight:600;cursor:pointer;margin-bottom:28px;padding:0;}
.pd-back:hover{text-decoration:underline;}
.pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;}
@media(max-width:680px){.pd-grid{grid-template-columns:1fr;gap:24px;}}
.pd-img{border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);display:flex;align-items:center;justify-content:center;font-size:8rem;min-height:320px;}
.pd-info{}
.pd-cat{font-size:.75rem;font-weight:700;color:var(--sf);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;}
.pd-name{font-family:'Cormorant Garamond',serif;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;line-height:1.2;margin-bottom:12px;}
.pd-stars{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
.pd-stars .stars{font-size:.95rem;}
.pd-stars .rv{font-size:.85rem;}
.pd-price-row{display:flex;align-items:baseline;gap:12px;margin-bottom:8px;}
.pd-price{font-size:2rem;font-weight:700;color:var(--dk);}
.pd-oprice{font-size:1rem;color:var(--mt);text-decoration:line-through;}
.pd-disc{background:#E8F5EC;color:var(--ok);font-size:.82rem;font-weight:700;padding:3px 10px;border-radius:12px;}
.pd-gi{display:inline-flex;align-items:center;gap:6px;background:rgba(201,144,26,.1);border:1px solid var(--gd);color:var(--gd);font-size:.75rem;font-weight:600;padding:4px 12px;border-radius:14px;margin-bottom:18px;}
.pd-desc{color:var(--mt);font-size:.95rem;line-height:1.7;margin-bottom:22px;}

/* SIZE SELECTOR */
.pd-label{font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--dk);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.sz-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
.pd-sz{padding:8px 18px;border-radius:8px;border:1.5px solid var(--bd);background:#fff;font-size:.88rem;font-weight:600;cursor:pointer;transition:all .2s;color:var(--mt);}
.pd-sz:hover{border-color:var(--sf);color:var(--sf);}
.pd-sz.act{border-color:var(--sf);background:rgba(232,98,10,.08);color:var(--sf);}

/* COLOR SELECTOR */
.clr-row{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.clr-dot{width:28px;height:28px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:all .2s;position:relative;}
.clr-dot.act{border-color:var(--sf);box-shadow:0 0 0 2px rgba(232,98,10,.3);}
.clr-name{font-size:.82rem;color:var(--mt);margin-left:4px;align-self:center;}

/* SIZE GUIDE */
.sg-toggle{display:flex;align-items:center;gap:6px;background:none;border:1px dashed var(--bd);padding:7px 14px;border-radius:8px;font-size:.82rem;font-weight:600;color:var(--mt);cursor:pointer;transition:all .2s;margin-bottom:12px;}
.sg-toggle:hover{border-color:var(--sf);color:var(--sf);}
.sg-wrap{background:#FAFAFA;border:1px solid var(--bd);border-radius:10px;overflow:hidden;margin-bottom:18px;}
.sg-table{width:100%;border-collapse:collapse;font-size:.83rem;}
.sg-table th{background:var(--dk);color:#fff;padding:9px 12px;text-align:left;font-weight:600;font-size:.78rem;letter-spacing:.04em;}
.sg-table td{padding:9px 12px;border-bottom:1px solid var(--bd);color:var(--mt);}
.sg-table tr:last-child td{border-bottom:none;}
.sg-table tr.sg-act td{background:#FFF0DC;color:var(--dk);font-weight:600;}
.sg-sel{display:inline-block;background:var(--sf);color:#fff;font-size:.65rem;font-weight:800;padding:2px 7px;border-radius:8px;margin-left:6px;letter-spacing:.05em;}

/* QTY & ADD */
.qty-row{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
.qty-ctrl{display:flex;align-items:center;border:1.5px solid var(--bd);border-radius:8px;overflow:hidden;}
.qty-ctrl button{width:34px;height:34px;background:#fff;border:none;font-size:1.1rem;cursor:pointer;color:var(--mt);transition:background .2s;}
.qty-ctrl button:hover{background:var(--cr);}
.qty-ctrl span{width:40px;text-align:center;font-weight:700;font-size:.95rem;}
.pd-add{flex:1;background:var(--sf);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.03em;}
.pd-add:hover{background:var(--sf3);transform:translateY(-1px);}
.pd-wish{width:42px;height:42px;border:1.5px solid var(--bd);background:#fff;border-radius:10px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.pd-wish:hover{border-color:var(--sf);background:rgba(232,98,10,.06);}
.stock-low{font-size:.8rem;color:var(--er);font-weight:600;margin-bottom:12px;}

/* Delivery estimate */
.pd-delivery{background:linear-gradient(135deg,#F4EDE5,#FFF8F2);border:1px solid rgba(232,98,10,.14);border-radius:10px;padding:12px 14px;margin:14px 0;}
.pd-delivery-hd{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--sf);margin-bottom:9px;}
.pd-del-row{display:flex;align-items:baseline;gap:7px;font-size:.84rem;color:var(--dk);margin-bottom:6px;line-height:1.4;}
.pd-del-row:last-child{margin-bottom:0;}
.pd-del-icon{font-size:.95rem;flex-shrink:0;}
.pd-del-days{font-size:.74rem;color:var(--mt);margin-left:2px;}

/* Share bar */
.pd-share-row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.pd-share-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .18s;border:1.5px solid;font-family:'DM Sans',sans-serif;letter-spacing:.02em;}
.pd-share-copy{background:#fff;border-color:var(--bd);color:var(--mt);}
.pd-share-copy:hover,.pd-share-copy.done{border-color:var(--sf);color:var(--sf);background:rgba(232,98,10,.04);}
.pd-share-wa{background:#25D366;border-color:#25D366;color:#fff;}
.pd-share-wa:hover{background:#1ab553;border-color:#1ab553;transform:translateY(-1px);}

/* TABS */
.tabs{display:flex;gap:0;border-bottom:2px solid var(--bd);margin:28px 0 20px;}
.tab{padding:10px 18px;background:none;border:none;font-size:.88rem;font-weight:600;cursor:pointer;color:var(--mt);transition:all .2s;border-bottom:2px solid transparent;margin-bottom:-2px;}
.tab.act{color:var(--sf);border-bottom-color:var(--sf);}
.tab-body{font-size:.9rem;color:var(--mt);line-height:1.75;}
.feat-list{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.feat-list li{display:flex;align-items:flex-start;gap:7px;font-size:.88rem;}
.feat-list li::before{content:'✓';color:var(--sf);font-weight:700;flex-shrink:0;}
.spec-table{width:100%;border-collapse:collapse;font-size:.88rem;}
.spec-table tr{border-bottom:1px solid var(--bd);}
.spec-table tr:last-child{border-bottom:none;}
.spec-table td{padding:9px 12px;}
.spec-table td:first-child{font-weight:600;color:var(--dk);width:40%;}
.spec-table td:last-child{color:var(--mt);}

/* IMAGE SLIDER */
.pd-slider{border-radius:16px;overflow:hidden;position:relative;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);min-height:320px;}
.pd-slide-main{width:100%;aspect-ratio:1;object-fit:cover;display:block;}
.pd-slide-emoji{display:flex;align-items:center;justify-content:center;font-size:8rem;min-height:320px;}
.pd-slide-arrow{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.9);border:none;border-radius:50%;width:38px;height:38px;cursor:pointer;font-size:.95rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:all .2s;z-index:2;line-height:1;}
.pd-slide-arrow:hover{background:#fff;transform:translateY(-50%) scale(1.08);}
.pd-slide-arrow.prev{left:10px;}
.pd-slide-arrow.next{right:10px;}
.pd-slide-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;}
.pd-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.6);border:none;cursor:pointer;padding:0;transition:all .2s;}
.pd-dot.act{background:#fff;transform:scale(1.3);}
.pd-thumbs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.pd-thumb{width:62px;height:62px;border-radius:9px;object-fit:cover;cursor:pointer;border:2.5px solid #E8D5C0;transition:all .2s;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);flex-shrink:0;}
.pd-thumb:hover{border-color:var(--sf);}
.pd-thumb.act{border-color:var(--sf);box-shadow:0 0 0 2px rgba(232,98,10,.25);}
.pd-thumb-video{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:9px;cursor:pointer;border:2.5px solid #E8D5C0;background:#18100A;color:#fff;font-size:1.1rem;flex-shrink:0;transition:all .2s;}
.pd-thumb-video:hover,.pd-thumb-video.act{border-color:var(--sf);}
.pd-video-player{width:100%;border-radius:14px;margin-top:0;max-height:360px;object-fit:contain;background:#18100A;display:block;}

/* RELATED */
.rel-sec{background:var(--iv);padding:50px 20px;}
.rel-sec .sec-hd{margin-bottom:28px;}

/* CART */
.cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100;opacity:0;pointer-events:none;transition:opacity .3s;}
.cart-overlay.open{opacity:1;pointer-events:all;}
.cart-drawer{position:fixed;right:0;top:0;bottom:0;width:min(420px,100vw);background:#fff;z-index:1101;transform:translateX(100%);transition:transform .3s ease;display:flex;flex-direction:column;}
.cart-drawer.open{transform:translateX(0);}
.cart-hd{padding:20px 24px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;}
.cart-hd h3{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;}
.cart-close{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--mt);}
.cart-items{flex:1;overflow-y:auto;padding:16px 24px;}
.cart-empty{text-align:center;padding:60px 20px;color:var(--mt);}
.cart-empty span{display:block;font-size:3.5rem;margin-bottom:14px;}
.ci{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--bd);}
.ci-img{width:64px;height:64px;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0;}
.ci-info{flex:1;}
.ci-name{font-size:.9rem;font-weight:600;margin-bottom:3px;}
.ci-opt{font-size:.78rem;color:var(--mt);margin-bottom:8px;}
.ci-row{display:flex;align-items:center;justify-content:space-between;}
.ci-price{font-weight:700;font-size:.95rem;}
.ci-qty{display:flex;align-items:center;gap:7px;}
.ci-qty button{width:26px;height:26px;border-radius:6px;border:1px solid var(--bd);background:#fff;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;}
.ci-qty span{font-size:.88rem;font-weight:600;min-width:20px;text-align:center;}
.ci-del{background:none;border:none;color:var(--er);cursor:pointer;font-size:.82rem;font-weight:600;padding:4px;}
.cart-ft{padding:20px 24px;border-top:1px solid var(--bd);}
.cart-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.cart-total span:first-child{font-size:1rem;color:var(--mt);}
.cart-total span:last-child{font-size:1.3rem;font-weight:700;}
.checkout-btn{width:100%;background:var(--sf);color:#fff;border:none;padding:14px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.04em;}
.checkout-btn:hover{background:var(--sf3);}

/* AUTH MODAL */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:#fff;border-radius:18px;padding:36px;width:100%;max-width:420px;box-shadow:var(--sh2);}
.modal h2{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:700;margin-bottom:6px;}
.modal p{color:var(--mt);font-size:.9rem;margin-bottom:24px;}
.inp-grp{margin-bottom:16px;}
.inp-grp label{display:block;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--dk);margin-bottom:6px;}
.inp-grp input{width:100%;padding:11px 14px;border:1.5px solid var(--bd);border-radius:8px;font-size:.95rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;}
.inp-grp input:focus{border-color:var(--sf);}
.modal-btn{width:100%;background:var(--sf);color:#fff;border:none;padding:13px;border-radius:10px;font-size:.97rem;font-weight:700;cursor:pointer;margin-top:6px;}
.modal-sw{text-align:center;margin-top:14px;font-size:.88rem;color:var(--mt);}
.modal-sw button{background:none;border:none;color:var(--sf);font-weight:700;cursor:pointer;}
.modal-x{float:right;background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--mt);margin-top:-6px;}

/* CHECKOUT */
.ck-wrap{max-width:920px;margin:0 auto;padding:32px 20px;}
.ck-grid{display:grid;grid-template-columns:1fr 380px;gap:32px;}
@media(max-width:720px){.ck-grid{grid-template-columns:1fr;}}
.ck-form h3,.ck-summary h3{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:700;margin-bottom:20px;}
.ck-section{background:#fff;border-radius:14px;padding:24px;margin-bottom:20px;box-shadow:var(--sh);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:480px){.form-row{grid-template-columns:1fr;}}
.ck-summary{position:sticky;top:80px;}
.ck-sum-card{background:#fff;border-radius:14px;padding:24px;box-shadow:var(--sh);}
.ck-item{display:flex;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--bd);}
.ck-item:last-of-type{border-bottom:none;margin-bottom:0;padding-bottom:0;}
.ck-item-img{width:50px;height:50px;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;}
.ck-item-info{flex:1;}
.ck-item-name{font-size:.88rem;font-weight:600;margin-bottom:3px;}
.ck-item-opt{font-size:.78rem;color:var(--mt);}
.ck-item-price{font-weight:700;font-size:.92rem;align-self:center;flex-shrink:0;}
.ck-divider{border:none;border-top:1px solid var(--bd);margin:14px 0;}
.ck-row{display:flex;justify-content:space-between;font-size:.88rem;color:var(--mt);margin-bottom:8px;}
.ck-row.total{font-size:1.05rem;font-weight:700;color:var(--dk);}
.pay-btn{width:100%;background:var(--sf);color:#fff;border:none;padding:14px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:16px;transition:all .2s;}
.pay-btn:hover{background:var(--sf3);}
.razorpay-note{text-align:center;font-size:.75rem;color:var(--mt);margin-top:8px;}
.ship-opts{display:flex;flex-direction:column;gap:10px;}
.ship-opt{display:flex;align-items:center;gap:14px;padding:12px 16px;border:1.5px solid var(--bd);border-radius:8px;cursor:pointer;transition:all .2s;}
.ship-opt.sel{border-color:var(--sf);background:rgba(232,98,10,.05);}
.ship-opt input{accent-color:var(--sf);}
.ship-opt-info{flex:1;}
.ship-opt-name{font-weight:600;font-size:.9rem;}
.ship-opt-det{font-size:.78rem;color:var(--mt);}
.ship-opt-price{font-weight:700;font-size:.9rem;}

/* SUCCESS */
.succ-wrap{max-width:540px;margin:60px auto;padding:40px 24px;text-align:center;}
.succ-icon{font-size:4rem;margin-bottom:18px;display:block;}
.succ-wrap h2{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;margin-bottom:10px;}
.succ-wrap p{color:var(--mt);margin-bottom:28px;line-height:1.7;}
.succ-card{background:#fff;border-radius:14px;padding:24px;box-shadow:var(--sh);margin-bottom:28px;text-align:left;}
.succ-row{display:flex;justify-content:space-between;font-size:.88rem;padding:7px 0;border-bottom:1px solid var(--bd);}
.succ-row:last-child{border-bottom:none;}
.succ-row span:first-child{color:var(--mt);}
.succ-row span:last-child{font-weight:600;}

/* ABOUT */
.about-hero{background:linear-gradient(135deg,var(--dk),var(--dk2));color:#fff;padding:80px 20px;text-align:center;}
.about-hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,4vw,3rem);font-weight:700;margin-bottom:14px;}
.about-hero p{color:#BFB09A;font-size:1.05rem;max-width:560px;margin:0 auto;}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:60px 20px;}
@media(max-width:680px){.about-grid{grid-template-columns:1fr;gap:28px;}}
.about-img{border-radius:16px;background:linear-gradient(135deg,#FDF0E5,#FFF5EC);display:flex;align-items:center;justify-content:center;font-size:7rem;min-height:280px;}
.about-text h2{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:700;margin-bottom:14px;}
.about-text p{color:var(--mt);line-height:1.8;margin-bottom:14px;}
.about-text ul{list-style:none;display:flex;flex-direction:column;gap:10px;}
.about-text ul li{display:flex;align-items:flex-start;gap:9px;color:var(--mt);font-size:.95rem;line-height:1.6;}
.about-text ul li span:first-child{font-size:1.1rem;flex-shrink:0;}

/* FOOTER */
footer{background:var(--dk);color:#BFB09A;padding:50px 20px 28px;}
.foot-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1.5fr;gap:32px;margin-bottom:40px;}
@media(max-width:768px){.foot-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:480px){.foot-grid{grid-template-columns:1fr;}}
.foot-brand .logo{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;color:var(--gd);margin-bottom:10px;}
.foot-brand .logo span{color:var(--sf);}
.foot-brand p{font-size:.85rem;line-height:1.7;margin-bottom:14px;}
.foot-social{display:flex;gap:10px;margin-top:10px;}
.foot-social a{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:.9rem;text-decoration:none;transition:background .2s;}
.foot-social a:hover{background:rgba(232,98,10,.3);}
.foot-col h4{font-size:.82rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#fff;margin-bottom:14px;}
.foot-col ul{list-style:none;display:flex;flex-direction:column;gap:9px;}
.foot-col ul li a,.foot-col ul li button{color:#BFB09A;text-decoration:none;font-size:.86rem;background:none;border:none;cursor:pointer;padding:0;text-align:left;transition:color .2s;}
.foot-col ul li a:hover,.foot-col ul li button:hover{color:var(--sf2);}
.foot-pay{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.pay-badge{background:rgba(255,255,255,.1);border-radius:6px;padding:4px 10px;font-size:.72rem;font-weight:600;color:#C4B49A;}
.foot-bottom{max-width:1200px;margin:0 auto;padding-top:20px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:.8rem;}
.gi-strip{background:rgba(201,144,26,.08);border-top:1px solid rgba(201,144,26,.15);padding:10px 20px;text-align:center;font-size:.78rem;color:var(--gd2);}

/* COUPON */
.coupon-row{display:flex;gap:10px;}
.coupon-input{flex:1;padding:11px 14px;border:1.5px solid var(--bd);border-radius:8px;font-size:.95rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;text-transform:uppercase;letter-spacing:.06em;font-weight:600;}
.coupon-input:focus{border-color:var(--sf);}
.coupon-apply-btn{padding:10px 20px;background:var(--dk);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.9rem;transition:background .2s;white-space:nowrap;}
.coupon-apply-btn:hover{background:var(--dk2);}
.coupon-apply-btn:disabled{opacity:.5;cursor:not-allowed;}
.coupon-applied{display:flex;align-items:center;justify-content:space-between;background:#E8F5EC;border:1.5px solid #A8D5B5;border-radius:8px;padding:12px 14px;}
.coupon-remove{background:none;border:none;color:#C0392B;cursor:pointer;font-size:.8rem;font-weight:700;padding:4px 8px;border-radius:6px;transition:background .2s;}
.coupon-remove:hover{background:rgba(192,57,43,.1);}
.coupon-error{color:var(--er);font-size:.82rem;font-weight:600;margin-top:8px;}

/* TRACK ORDER PAGE */
.track-wrap{max-width:680px;margin:0 auto;padding:40px 20px;}
.track-input{flex:1;padding:13px 16px;border:1.5px solid var(--bd);border-radius:10px;font-size:1rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;background:#fff;}
.track-input:focus{border-color:var(--sf);}

/* TOAST */
.toast-wrap{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;}
.toast{background:var(--dk);color:#fff;padding:12px 22px;border-radius:24px;font-size:.88rem;font-weight:600;box-shadow:0 4px 24px rgba(0,0,0,.25);animation:toastIn .3s ease;display:flex;align-items:center;gap:8px;}
.toast.ok{background:#1E6B3C;}
.toast.er{background:var(--er);}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* MARQUEE STRIP */
.mq-wrap{overflow:hidden;padding:12px 0;position:relative;user-select:none;}
.mq-fade{position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none;}
.mq-fade-l{left:0;}
.mq-fade-r{right:0;}
.mq-track{display:flex;width:max-content;animation:mq-scroll 28s linear infinite;}
.mq-track:hover{animation-play-state:paused;}
.mq-item{display:inline-flex;align-items:center;gap:16px;white-space:nowrap;font-size:.82rem;font-weight:700;letter-spacing:.04em;padding:0 8px;}
.mq-sep{opacity:.45;font-size:.58rem;}
@keyframes mq-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(max-width:600px){.mq-item{font-size:.78rem;gap:12px;}.mq-fade{width:40px;}}

/* FLOATING EMBERS */
@keyframes ember-rise{
  0%   { transform:translateY(0)    rotate(0deg);   opacity:.75; }
  60%  { opacity:.5; }
  100% { transform:translateY(-130px) rotate(210deg); opacity:0; }
}

/* SELF-DRAWING BRUSH STROKE */
.brush-svg{display:block;width:clamp(150px,26vw,240px);margin:-4px auto 0;overflow:visible;pointer-events:none;}
.brush-path{stroke-dasharray:290;stroke-dashoffset:290;animation:brush-draw 1.5s cubic-bezier(.38,0,.35,1) 1.1s forwards;}
@keyframes brush-draw{to{stroke-dashoffset:0}}

/* OUR STORY SECTION */
.story-sec{background:var(--dk);padding:72px 20px;overflow:hidden;}
.story-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,80px);align-items:center;}
.story-eyebrow{display:inline-block;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:var(--sf);background:rgba(232,98,10,.15);border:1px solid rgba(232,98,10,.3);padding:5px 14px;border-radius:20px;margin-bottom:18px;}
.story-h2{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,4vw,3rem);font-weight:700;color:#fff;line-height:1.18;margin-bottom:22px;}
.story-p{font-size:.95rem;color:#BFB09A;line-height:1.82;margin-bottom:16px;}
.story-cta{background:var(--sf);color:#fff;border:none;padding:13px 30px;border-radius:30px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .22s;margin-top:8px;}
.story-cta:hover{background:var(--sf2);transform:translateY(-2px);box-shadow:0 6px 22px rgba(232,98,10,.35);}
.story-visual{position:relative;display:flex;align-items:center;justify-content:center;min-height:320px;}
.story-card{background:linear-gradient(135deg,rgba(232,98,10,.18),rgba(201,144,26,.12));border:1.5px solid rgba(232,98,10,.25);border-radius:22px;padding:40px 36px;text-align:center;position:relative;z-index:1;}
.story-tel-script{font-family:'Cormorant Garamond',serif;font-size:3.2rem;font-weight:700;color:var(--gd2);letter-spacing:.04em;margin-bottom:18px;}
.story-art-icons{font-size:2rem;letter-spacing:12px;margin-bottom:18px;}
.story-since{font-size:.78rem;font-weight:600;color:#9B8472;letter-spacing:.07em;text-transform:uppercase;}
.story-pill{position:absolute;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#E8DDD0;font-size:.75rem;font-weight:700;padding:6px 14px;border-radius:20px;white-space:nowrap;}
.story-pill-gi{top:14%;right:-4%;}
.story-pill-craft{bottom:16%;left:-4%;}
.story-ring{position:absolute;border-radius:50%;pointer-events:none;}
.story-ring-1{width:380px;height:380px;border:1px solid rgba(232,98,10,.08);top:50%;left:50%;transform:translate(-50%,-50%);}
.story-ring-2{width:480px;height:480px;border:1px dashed rgba(201,144,26,.06);top:50%;left:50%;transform:translate(-50%,-50%);}
@media(max-width:768px){
  .story-grid{grid-template-columns:1fr;gap:40px;}
  .story-visual{min-height:260px;}
  .story-pill-gi{top:4%;right:2%;}
  .story-pill-craft{bottom:4%;left:2%;}
}

/* COOKIE BANNER */
.cookie-wrap{position:fixed;bottom:0;left:0;right:0;z-index:9100;padding:12px 16px 16px;display:flex;justify-content:center;pointer-events:none;}
.ck-box{background:#18100A;color:#F4EDE5;border-radius:16px;padding:20px 20px 16px;max-width:680px;width:100%;box-shadow:0 -4px 32px rgba(0,0,0,.4);display:flex;flex-direction:column;gap:14px;pointer-events:auto;animation:ck-up .35s ease;}
@keyframes ck-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
.ck-hd{display:flex;gap:12px;align-items:flex-start;}
.ck-icon{font-size:1.5rem;flex-shrink:0;margin-top:2px;}
.ck-body{flex:1;min-width:0;}
.ck-title{font-weight:700;font-size:.98rem;color:#fff;margin-bottom:4px;}
.ck-desc{font-size:.82rem;color:#C4A882;line-height:1.6;}
.ck-more{background:none;border:none;color:#E8620A;cursor:pointer;font-size:.82rem;font-family:'DM Sans',sans-serif;padding:0 0 0 3px;text-decoration:underline;font-weight:600;}
.ck-detail{margin-top:10px;display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto;}
.ck-row{display:flex;gap:10px;padding:8px 10px;background:rgba(255,255,255,.06);border-radius:8px;}
.ck-row-icon{font-size:.95rem;flex-shrink:0;margin-top:2px;}
.ck-row-label{font-size:.8rem;font-weight:700;color:#fff;margin-bottom:2px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.ck-req{font-size:.68rem;background:#E8620A;color:#fff;padding:1px 7px;border-radius:10px;font-weight:600;}
.ck-row-desc{font-size:.74rem;color:#A89070;line-height:1.5;}
.ck-actions{display:flex;gap:10px;}
.ck-decline{flex:1;padding:10px;border:1.5px solid rgba(255,255,255,.22);border-radius:9px;background:transparent;color:#C4A882;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;transition:border-color .15s;}
.ck-decline:hover{border-color:rgba(255,255,255,.5);}
.ck-accept{flex:1;padding:10px;border:none;border-radius:9px;background:#E8620A;color:#fff;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;transition:background .15s;}
.ck-accept:hover{background:#d4571a;}
.ck-legal{font-size:.7rem;color:#6B5040;text-align:center;line-height:1.5;}
@media(max-width:480px){
  .cookie-wrap{padding:8px 10px 12px;}
  .ck-box{padding:16px 14px 14px;border-radius:14px;gap:12px;}
  .ck-icon{font-size:1.25rem;}
  .ck-title{font-size:.92rem;}
  .ck-desc{font-size:.79rem;}
  .ck-actions{flex-direction:column;gap:8px;}
  .ck-decline,.ck-accept{flex:none;width:100%;padding:12px;}
  .ck-accept{order:-1;}
  .ck-detail{max-height:160px;}
}

/* ANNOUNCEMENT BAR */
.ann-bar{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 20px;font-size:.85rem;font-weight:600;font-family:'DM Sans',sans-serif;text-align:center;position:relative;}
.ann-bar-text{flex:1;text-align:center;}
.ann-bar-close{background:none;border:none;cursor:pointer;font-size:1rem;color:inherit;opacity:.75;padding:2px 6px;border-radius:4px;transition:opacity .15s;flex-shrink:0;}
.ann-bar-close:hover{opacity:1;}

/* FREE SHIPPING PROGRESS BAR */
.fs-bar-wrap{padding:12px 16px;border-bottom:1px solid var(--bd);}
.fs-msg{font-size:.8rem;color:var(--mt);font-weight:500;margin-bottom:8px;}
.fs-msg strong{color:var(--sf);}
.fs-msg.fs-done{color:#1E6B3C;font-weight:700;}
.fs-bar-track{height:6px;background:#F0E8DF;border-radius:6px;overflow:hidden;}
.fs-bar-fill{height:100%;background:linear-gradient(90deg,var(--sf),var(--sf2));border-radius:6px;transition:width .5s ease;}

/* LIVE VIEWER COUNT BADGE */
.viewer-badge{display:inline-flex;align-items:center;gap:6px;background:#FFF3ED;border:1.5px solid #FFD4B3;color:#C84E00;font-size:.8rem;font-weight:600;padding:5px 12px;border-radius:20px;margin:6px 0 12px;}
.viewer-dot{width:8px;height:8px;border-radius:50%;background:#E8620A;animation:viewer-pulse 1.8s ease-in-out infinite;flex-shrink:0;}
@keyframes viewer-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.75)}}

/* STICKY ADD TO CART (mobile only) */
.sticky-atc{display:none;}
@media(max-width:768px){
  .sticky-atc{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:990;background:#fff;border-top:1px solid var(--bd);padding:12px 16px;align-items:center;gap:12px;box-shadow:0 -4px 20px rgba(100,60,20,.14);animation:stickyIn .22s ease;}
  .sticky-atc-info{flex:1;min-width:0;}
  .sticky-atc-name{font-size:.85rem;font-weight:700;color:var(--dk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sticky-atc-price{font-size:.88rem;color:var(--sf);font-weight:700;margin-top:2px;}
  .sticky-atc-btn{background:var(--sf);color:#fff;border:none;padding:11px 22px;border-radius:24px;font-size:.88rem;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;flex-shrink:0;}
  .sticky-atc-btn:active{background:var(--sf3);}
}
@keyframes stickyIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}

/* PRODUCT REVIEW FORM (customer write-a-review) */
.rv-form{background:#FFF8F3;border:1.5px solid var(--bd);border-radius:14px;padding:24px;margin-top:24px;}
.rv-form-hd{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:700;color:var(--dk);margin-bottom:20px;}
.rv-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.rv-form-grp{display:flex;flex-direction:column;gap:6px;}
.rv-form-grp label{font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mt);}
.rv-form-grp input{padding:10px 14px;border:1.5px solid var(--bd);border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.88rem;background:#fff;color:var(--dk);outline:none;transition:border-color .15s;}
.rv-form-grp input:focus{border-color:var(--sf);}
.rv-upload-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border:1.5px dashed var(--bd);border-radius:9px;background:#fff;color:var(--mt);font-size:.84rem;font-weight:600;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;}
.rv-upload-btn:hover:not(:disabled){border-color:var(--sf);color:var(--sf);background:#FFF3ED;}
.rv-upload-btn:disabled{opacity:.55;cursor:not-allowed;}
.rv-write-btn{background:none;border:1.5px solid var(--sf);color:var(--sf);padding:10px 22px;border-radius:22px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;}
.rv-write-btn:hover{background:var(--sf);color:#fff;}
@media(max-width:600px){.rv-form-grid{grid-template-columns:1fr;}}

/* CONTACT PAGE */
.contact-hero{background:linear-gradient(135deg,#18100A 0%,#2D1E12 60%,#3D2A15 100%);padding:80px 20px 60px;text-align:center;}
.contact-body{max-width:1100px;margin:0 auto;padding:52px 20px;display:grid;grid-template-columns:1fr 340px;gap:36px;align-items:start;}
.contact-card{background:#fff;border-radius:20px;padding:36px;box-shadow:0 4px 30px rgba(100,60,20,.1);}
.contact-card h2{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:700;color:#18100A;margin-bottom:24px;}
.contact-info{display:flex;flex-direction:column;gap:16px;}
.ct-info-card{background:#fff;border-radius:16px;padding:22px;box-shadow:0 4px 20px rgba(100,60,20,.08);}
.ct-info-icon{font-size:1.8rem;margin-bottom:10px;}
.ct-info-card h4{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:700;color:#18100A;margin-bottom:6px;}
.ct-info-card p{font-size:.85rem;color:#6B4C38;line-height:1.6;margin:0;}
.ct-info-card a{color:#E8620A;text-decoration:none;}
.ct-info-card a:hover{text-decoration:underline;}
.ct-grp{margin-bottom:18px;display:flex;flex-direction:column;gap:5px;}
.ct-grp label{font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6B4C38;}
.ct-inp{width:100%;padding:11px 14px;border:1.5px solid #E8D5C0;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#18100A;background:#fff;outline:none;transition:border-color .15s;}
.ct-inp:focus{border-color:#E8620A;}
.ct-inp-err{border-color:#C0392B !important;}
.ct-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ct-submit{width:100%;padding:14px;background:linear-gradient(135deg,#E8620A,#C9901A);border:none;border-radius:12px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:transform .15s,box-shadow .15s;margin-top:8px;letter-spacing:.03em;}
.ct-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(232,98,10,.35);}
.ct-submit:disabled{opacity:.65;cursor:not-allowed;}
@media(max-width:900px){.contact-body{grid-template-columns:1fr;}}
@media(max-width:600px){.ct-row{grid-template-columns:1fr;}}
`;

export default S;
