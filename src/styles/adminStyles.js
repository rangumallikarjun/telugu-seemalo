const AS = `
/* ─── ADMIN LAYOUT ─────────────────────────────────────────────────────────── */
.admin-wrap{display:flex;min-height:100vh;background:#F4F6F9;}
.admin-sidebar{width:240px;background:#18100A;color:#C4B49A;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:200;overflow-y:auto;}
.admin-logo{padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.08);}
.admin-logo h2{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;color:#F0BB50;margin-bottom:2px;}
.admin-logo p{font-size:.72rem;color:#8A7060;text-transform:uppercase;letter-spacing:.1em;}
.admin-nav{flex:1;padding:16px 0;}
.admin-nav-item{display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;border:none;background:none;color:#C4B49A;font-size:.88rem;font-weight:500;width:100%;text-align:left;transition:all .2s;border-left:3px solid transparent;}
.admin-nav-item:hover{background:rgba(232,98,10,.1);color:#FF8C38;border-left-color:rgba(232,98,10,.3);}
.admin-nav-item.active{background:rgba(232,98,10,.15);color:#FF8C38;border-left-color:#E8620A;}
.admin-nav-item .icon{font-size:1.1rem;width:20px;text-align:center;}
.admin-nav-sep{height:1px;background:rgba(255,255,255,.06);margin:8px 20px;}
.admin-nav-logout{display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;border:none;background:none;color:#8A7060;font-size:.85rem;width:100%;text-align:left;transition:color .2s;margin-top:auto;}
.admin-nav-logout:hover{color:#C0392B;}
.admin-sidebar-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.06);}
.admin-sidebar-user{font-size:.8rem;color:#8A7060;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.admin-sidebar-user span{display:block;color:#C4B49A;font-weight:600;font-size:.85rem;}

.admin-main{margin-left:240px;flex:1;min-height:100vh;}
.admin-topbar{background:#fff;padding:16px 28px;border-bottom:1px solid #E8E0D5;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 1px 4px rgba(0,0,0,.06);}
.admin-topbar h1{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;color:#18100A;}
.admin-topbar-right{display:flex;align-items:center;gap:12px;font-size:.85rem;color:#6B4C38;}
.admin-content{padding:28px;}
.admin-settings-grid{column-count:2;column-gap:24px;column-fill:balance;}
.admin-settings-grid .admin-card{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;max-width:none!important;width:100%;display:inline-block;}
@media(max-width:1100px){.admin-settings-grid{column-count:1;}}

/* ─── ADMIN STAT CARDS ──────────────────────────────────────────────────────── */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px;margin-bottom:28px;}
.stat-card{background:#fff;border-radius:12px;padding:20px 24px;box-shadow:0 2px 10px rgba(0,0,0,.06);border-left:4px solid var(--lc,#E8620A);}
.stat-card-icon{font-size:1.8rem;margin-bottom:10px;}
.stat-card-val{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:700;color:#18100A;line-height:1;}
.stat-card-label{font-size:.78rem;color:#6B4C38;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-top:6px;}

/* ─── ADMIN TABLES ──────────────────────────────────────────────────────────── */
.admin-card{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;margin-bottom:24px;}
.admin-card-hd{padding:18px 24px;border-bottom:1px solid #F0E8DF;display:flex;align-items:center;justify-content:space-between;}
.admin-card-hd h3{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:700;color:#18100A;}
.admin-table{width:100%;border-collapse:collapse;font-size:.86rem;}
.admin-table th{background:#F8F4F0;color:#6B4C38;font-weight:700;font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;padding:11px 16px;text-align:left;border-bottom:1px solid #E8D5C0;}
.admin-table td{padding:13px 16px;border-bottom:1px solid #F4EDE5;vertical-align:middle;color:#2D1E12;}
.admin-table tr:last-child td{border-bottom:none;}
.admin-table tr:hover td{background:#FDFAF7;}
.admin-table .emoji-cell{font-size:1.5rem;width:48px;}

/* ─── BADGES ────────────────────────────────────────────────────────────────── */
.badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:.72rem;font-weight:700;letter-spacing:.04em;}
.badge-processing{background:#FFF3DC;color:#B7770D;}
.badge-shipped{background:#EAF2FF;color:#1A5276;}
.badge-delivered{background:#E8F5EC;color:#2D7D46;}
.badge-admin{background:rgba(232,98,10,.12);color:#CC4E00;}
.badge-customer{background:#F4F6F9;color:#6B4C38;}

/* ─── ADMIN BUTTONS ─────────────────────────────────────────────────────────── */
.admin-btn{padding:8px 16px;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s;border:none;}
.admin-btn-primary{background:#E8620A;color:#fff;}
.admin-btn-primary:hover{background:#CC4E00;}
.admin-btn-outline{background:#fff;color:#6B4C38;border:1.5px solid #E8D5C0;}
.admin-btn-outline:hover{border-color:#E8620A;color:#E8620A;}
.admin-btn-danger{background:#fff;color:#C0392B;border:1.5px solid #C0392B;}
.admin-btn-danger:hover{background:#C0392B;color:#fff;}
.admin-btn-sm{padding:5px 11px;font-size:.76rem;}
.admin-btn-icon{width:32px;height:32px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;border:1.5px solid #E8D5C0;background:#fff;cursor:pointer;font-size:.9rem;transition:all .2s;}
.admin-btn-icon:hover{border-color:#E8620A;}

/* ─── ADMIN FORM / MODAL ─────────────────────────────────────────────────────── */
.admin-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:3000;display:flex;align-items:center;justify-content:center;padding:20px;}
.admin-modal{background:#fff;border-radius:16px;padding:28px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,.2);}
.admin-modal h2{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;margin-bottom:20px;color:#18100A;}
.admin-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.admin-inp-grp{margin-bottom:14px;}
.admin-inp-grp label{display:block;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6B4C38;margin-bottom:5px;}
.admin-inp-grp input,.admin-inp-grp select,.admin-inp-grp textarea{width:100%;padding:9px 12px;border:1.5px solid #E8D5C0;border-radius:8px;font-size:.9rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;background:#fff;}
.admin-inp-grp input:focus,.admin-inp-grp select:focus,.admin-inp-grp textarea:focus{border-color:#E8620A;}
.admin-inp-grp textarea{resize:vertical;min-height:80px;}
.admin-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid #F0E8DF;}

/* ─── SEARCH BAR ─────────────────────────────────────────────────────────────── */
.admin-search{padding:8px 14px;border:1.5px solid #E8D5C0;border-radius:8px;font-size:.85rem;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;width:220px;}
.admin-search:focus{border-color:#E8620A;}

/* ─── STATUS SELECT ─────────────────────────────────────────────────────────── */
.status-select{padding:5px 10px;border:1.5px solid #E8D5C0;border-radius:7px;font-size:.8rem;font-family:'DM Sans',sans-serif;cursor:pointer;outline:none;background:#fff;}
.status-select:focus{border-color:#E8620A;}

/* ─── EMPTY STATE ────────────────────────────────────────────────────────────── */
.admin-empty{text-align:center;padding:48px 20px;color:#6B4C38;}
.admin-empty span{display:block;font-size:2.5rem;margin-bottom:12px;}

/* ─── LOADING / SPINNER ────────────────────────────────────────────────────── */
.admin-loading{text-align:center;padding:48px;color:#6B4C38;font-size:.95rem;display:flex;flex-direction:column;align-items:center;gap:14px;}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{display:inline-block;border-radius:50%;border:2.5px solid rgba(232,98,10,.2);border-top-color:#E8620A;animation:spin .75s linear infinite;}
.spinner-sm{width:16px;height:16px;border-width:2px;}
.spinner-md{width:28px;height:28px;}
.spinner-lg{width:44px;height:44px;border-width:3.5px;}

/* ─── MEDIA UPLOAD ──────────────────────────────────────────────────────────── */
.upload-zone{border:2px dashed #E8D5C0;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.upload-zone:hover{border-color:#E8620A;background:rgba(232,98,10,.03);}
.upload-zone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;margin-bottom:10px;}
.media-thumb{position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;background:#F4EDE5;}
.media-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.media-thumb-del{position:absolute;top:4px;right:4px;background:rgba(192,57,43,.9);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;}
.media-thumb-badge{position:absolute;bottom:4px;left:4px;background:rgba(232,98,10,.9);color:#fff;font-size:.58rem;padding:2px 5px;border-radius:4px;font-weight:800;letter-spacing:.04em;}
.upload-prog{height:4px;border-radius:2px;background:#F0E8DF;overflow:hidden;margin-top:8px;}
.upload-prog-bar{height:100%;background:#E8620A;border-radius:2px;transition:width .3s;}
.video-preview-wrap{position:relative;border-radius:10px;overflow:hidden;background:#18100A;margin-bottom:8px;}
.video-preview-wrap video{width:100%;max-height:180px;display:block;object-fit:cover;}

/* ─── SEED BANNER ───────────────────────────────────────────────────────────── */
.seed-banner{background:linear-gradient(135deg,#FFF5E6,#FFF0D4);border:1.5px solid #F0BB50;border-radius:12px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.seed-banner p{color:#7B4F2E;font-size:.9rem;line-height:1.6;}
.seed-banner strong{color:#18100A;}

@media(max-width:768px){
  .admin-sidebar{transform:translateX(-100%);transition:transform .3s;}
  .admin-sidebar.open{transform:translateX(0);}
  .admin-main{margin-left:0;}
  .admin-form-grid{grid-template-columns:1fr;}
}

/* ─── SUPPORT TICKETS ───────────────────────────────────────────────────────── */
.sup-wrap{display:grid;grid-template-columns:360px 1fr;height:calc(100vh - 130px);border-top:1px solid #E8E0D5;overflow:hidden;background:#fff;}
.sup-list{border-right:1px solid #E8E0D5;overflow-y:auto;display:flex;flex-direction:column;background:#FAFAFA;}
.sup-filters{padding:14px 14px 10px;border-bottom:1px solid #E8E0D5;display:flex;flex-direction:column;gap:9px;position:sticky;top:0;background:#FAFAFA;z-index:1;}
.sup-search{padding:8px 12px;border:1.5px solid #E8D5C0;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.84rem;outline:none;width:100%;background:#fff;}
.sup-search:focus{border-color:#E8620A;}
.sup-filter-row{display:flex;gap:8px;}
.sup-filter-row select{flex:1;padding:6px 8px;border:1.5px solid #E8D5C0;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:.78rem;background:#fff;cursor:pointer;outline:none;}
.sup-item{padding:14px 14px;border-bottom:1px solid #F0E8DF;cursor:pointer;transition:background .12s;position:relative;}
.sup-item:hover{background:#FFF8F4;}
.sup-item.active{background:#FFF3ED;border-left:3px solid #E8620A;}
.sup-item-top{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.sup-item-name{font-weight:700;font-size:.86rem;color:#18100A;}
.sup-item-id{font-size:.7rem;color:#9B8472;font-weight:600;margin-left:auto;}
.sup-item-subject{font-size:.8rem;color:#6B4C38;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;}
.sup-item-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.sup-unread{width:8px;height:8px;border-radius:50%;background:#E8620A;position:absolute;top:14px;right:12px;flex-shrink:0;box-shadow:0 0 0 2px #FFF3ED;}
.sup-badge{font-size:.67rem;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;}
.sup-badge-open{background:#FFF3E0;color:#E65100;}
.sup-badge-inprog{background:#E3F2FD;color:#1565C0;}
.sup-badge-resolved{background:#E8F5E9;color:#2D7D46;}
.sup-badge-closed{background:#F5F5F5;color:#777;}
.sup-pri-high{background:#FFF3E0;color:#E65100;}
.sup-pri-urgent{background:#FDE8E8;color:#C0392B;}
.sup-pri-normal{display:none;}
.sup-date{font-size:.7rem;color:#9B8472;}

/* ticket detail panel */
.sup-detail{display:flex;flex-direction:column;height:100%;overflow:hidden;}
.sup-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#9B8472;gap:12px;text-align:center;padding:40px;}
.sup-detail-hd{padding:14px 20px;border-bottom:1px solid #E8E0D5;background:#FAFAFA;flex-shrink:0;}
.sup-detail-hd-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;}
.sup-detail-title{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:700;color:#18100A;margin-bottom:8px;line-height:1.3;}
.sup-detail-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.sup-detail-controls select{padding:5px 8px;border:1.5px solid #E8D5C0;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:.78rem;background:#fff;cursor:pointer;outline:none;}
.sup-thread{flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:0;}
.sup-cust-info{background:#FFF8F4;border:1px solid #F0E8DF;border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;gap:16px;flex-wrap:wrap;}
.sup-cust-info-item{font-size:.82rem;color:#6B4C38;display:flex;gap:6px;align-items:center;}
.sup-cust-info-item strong{color:#18100A;}
.sup-msg-wrap{display:flex;flex-direction:column;gap:12px;}
.sup-msg{padding:11px 15px;border-radius:14px;font-size:.85rem;line-height:1.6;word-break:break-word;}
.sup-msg-cust{background:#F4F0EC;color:#18100A;border-radius:14px 14px 14px 2px;max-width:78%;align-self:flex-start;}
.sup-msg-admin{background:linear-gradient(135deg,#E8620A,#C9901A);color:#fff;border-radius:14px 14px 2px 14px;max-width:78%;align-self:flex-end;}
.sup-msg-label{font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:3px;opacity:.7;}
.sup-msg-time{font-size:.67rem;margin-top:3px;opacity:.6;}
.sup-notes{padding:10px 12px;border:1.5px solid #E8D5C0;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.82rem;resize:vertical;outline:none;background:#FFFDF5;width:100%;color:#18100A;transition:border-color .15s;}
.sup-notes:focus{border-color:#C9901A;}
.sup-reply-area{padding:14px 18px;border-top:1px solid #E8E0D5;background:#FAFAFA;flex-shrink:0;}
.sup-reply-area textarea{width:100%;padding:10px 13px;border:1.5px solid #E8D5C0;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.87rem;resize:none;outline:none;background:#fff;transition:border-color .15s;color:#18100A;}
.sup-reply-area textarea:focus{border-color:#E8620A;}
.sup-reply-actions{display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:10px;flex-wrap:wrap;}
.sup-send-btn{background:linear-gradient(135deg,#E8620A,#C9901A);border:none;border-radius:10px;color:#fff;padding:9px 20px;font-weight:700;font-size:.87rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:transform .12s,box-shadow .12s;white-space:nowrap;}
.sup-send-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(232,98,10,.3);}
.sup-send-btn:disabled{opacity:.6;cursor:not-allowed;}

/* ─── IMAGE CROP MODAL ─────────────────────────────────────────────────────── */
.crop-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:4000;display:flex;align-items:center;justify-content:center;padding:20px;}
.crop-modal{background:#1A1310;border-radius:16px;width:100%;max-width:760px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;font-family:'DM Sans',sans-serif;}
.crop-modal-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08);}
.crop-modal-title{display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:#fff;font-weight:700;font-size:.98rem;}
.crop-frame-badge{background:rgba(232,98,10,.18);border:1px solid rgba(232,98,10,.4);color:#F0952C;font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:6px;}
.crop-remaining-badge{background:rgba(255,255,255,.08);color:#9B8472;font-size:.68rem;font-weight:600;padding:3px 9px;border-radius:6px;}
.crop-modal-close{background:none;border:none;color:#8A7060;font-size:1.1rem;cursor:pointer;padding:4px;line-height:1;transition:color .15s;}
.crop-modal-close:hover{color:#fff;}
.crop-modal-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.06);}
.crop-ctrl-label{color:#8A7060;font-size:.76rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-right:4px;}
.crop-aspect-btn{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);color:#C4B49A;font-size:.78rem;font-weight:600;padding:5px 11px;border-radius:7px;cursor:pointer;transition:all .15s;}
.crop-aspect-btn:hover{border-color:rgba(232,98,10,.5);color:#F0952C;}
.crop-aspect-btn.act{background:rgba(232,98,10,.2);border-color:#E8620A;color:#F0952C;}
.crop-reset-btn{background:none;border:1.5px solid rgba(255,255,255,.1);color:#8A7060;font-size:.78rem;font-weight:600;padding:5px 11px;border-radius:7px;cursor:pointer;margin-left:auto;transition:all .15s;}
.crop-reset-btn:hover{color:#fff;border-color:rgba(255,255,255,.3);}
.crop-dims{color:#8A7060;font-size:.76rem;font-weight:600;white-space:nowrap;}
.crop-modal-zoom{display:flex;align-items:center;gap:10px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.06);color:#C4B49A;font-size:.8rem;}
.crop-modal-zoom button{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:1rem;line-height:1;flex-shrink:0;}
.crop-modal-zoom button:hover{background:rgba(232,98,10,.2);border-color:#E8620A;}
.crop-modal-zoom input[type=range]{flex:1;accentColor:#E8620A;accent-color:#E8620A;}
.crop-zoom-pct{color:#F0952C;font-weight:700;width:42px;text-align:right;flex-shrink:0;}
.crop-modal-area{position:relative;height:min(50vh,420px);background:#0A0705;flex-shrink:1;overflow:hidden;}
.crop-modal-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid rgba(255,255,255,.08);}
.crop-hint{color:#6B5A4C;font-size:.76rem;}
.crop-modal-actions{display:flex;gap:10px;margin-left:auto;}
`;

export default AS;
