import html2pdf from 'html2pdf.js';

async function imageToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`imageToBase64: failed to fetch ${url} — status ${response.status}`);
      return '';
    }
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`imageToBase64: error fetching ${url}`, err);
    return '';
  }
}

const MAX_FIELD_LEN = 200;
const MAX_NOTES_LEN = 500;

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .slice(0, MAX_FIELD_LEN)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
function sanitizeOrderId(id) {
  if (!id) return '';
  return String(id).replace(/[^A-Za-z0-9\-_]/g, '').slice(0, 32);
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtOrderNum(order) {
  if (order.invoiceNo) return escapeHtml(order.invoiceNo);
  if (order.orderNumber) {
    const safeNum = String(order.orderNumber).replace(/[^0-9]/g, '');
    return `O${safeNum}`;
  }
  if (!order._id) return '—';
  const safeId = sanitizeOrderId(order._id);
  return `O${safeId.slice(-4).toUpperCase()}`;
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

export async function downloadInvoice(order, customerName, customerEmail) {
  if (!order) return;

  const items      = Array.isArray(order.items) ? order.items : [];
  const subtotal = safeNum(order.subtotal, items.reduce((s, i) => s + safeNum(i.price || i.unitPrice) * safeNum(i.quantity), 0));
  const discount = safeNum(order.discount);
  const shipping = safeNum(order.shippingCost || 0);
  const taxPercent = safeNum(order.taxPercent || 8); 
  const tax        = safeNum(order.tax || order.taxAmount || (subtotal - discount) * (taxPercent / 100));
  const total      = safeNum(order.total || order.totalAmountDue || (subtotal - discount + shipping + tax));
  const addr       = order.shippingAddress || order.clientDetails || {};
  const orderNum = fmtOrderNum(order);
  const invoiceDate = fmtDate(order.createdAt || order.invoiceDate);
  const dueDate     = order.dueDate ? fmtDate(order.dueDate) : fmtDate(Date.now() + 10 * 24 * 60 * 60 * 1000);

  const safeName  = escapeHtml(customerName  || addr.clientName || addr.fullName || '');
  const safeCompany = escapeHtml(addr.companyName || '');
  const safeEmail = escapeHtml(customerEmail || addr.email || '');
  const safePhone = escapeHtml(addr.phone    || '');
  
  const addrLines = [addr.addressLine1 || addr.address, addr.city, addr.state, addr.country].filter(Boolean);
  const line1 = escapeHtml(addrLines[0] || '');
  const line2 = escapeHtml(addrLines.slice(1).join(', ') || '');

  const itemRows = items.map((item, idx) => {
    const itemName  = escapeHtml(item.name || '—');
    const itemQty   = safeNum(item.quantity);
    const itemPrice = safeNum(item.price || item.unitPrice);
    return `
    <tr>
      <td class="center">${idx + 1}</td>
      <td class="item-name">${itemName}</td>
      <td class="center">${itemQty}</td>
      <td class="right">${itemPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td class="right total-cell">${(itemPrice * itemQty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    </tr>`;
  }).join('');

  const minRows = 4;
  let fillerRows = '';
  for (let i = items.length; i < minRows; i++) {
    fillerRows += `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>`;
  }

  const cartDataUrl = await imageToBase64('/images/cart.png');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice ${orderNum}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; }
  body { font-size: 10px; color: #000; background: #fff; line-height: 1.3; }
  
  .page { max-width: 800px; margin: 0 auto; padding: 20px 24px; position: relative; }

  /* HEADER BLOCK */
  .brand-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .brand-logo { width: 68px; height: 68px; object-fit: contain; }
  
  .brand-text { display: flex; flex-direction: column; }
  .brand-title { font-size: 28px; font-weight: 700; color: #F4B41A; }
  .brand-tagline { font-size: 10px; color: #000; font-weight: 700; margin-top: 4px; }
  
  .main-invoice-title { text-align: right; width: 245px; display: flex; flex-direction: column; align-items: flex-end; }
  .main-invoice-title h1 { font-size: 44px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 8px; font-family: 'Times New Roman', Times, serif; }
  
  .top-mini-meta { 
    width: 100%; 
    font-size: 11px; 
    border: 1px solid #d8d8d8; 
    border-radius: 6px; 
    padding: 8px 12px; 
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .top-mini-meta div { display: flex; align-items: center; justify-content: flex-start; width: 100%; }
  .top-mini-meta .label { width: 72px; text-align: left; font-weight: 500; font-size: 11px; color: #000; }
  .top-mini-meta .dots { width: 15px; text-align: center; font-size: 11px; color: #000; }
  .top-mini-meta .line-input { 
    flex: 1; 
    border-bottom: 1px solid #000; 
    height: 15px; 
    padding-left: 10px; 
    font-weight: 500;
    text-align: left;
    font-size: 11px;
  } 

  /* OFFICE DETAILS BLOCK */
  .offices-row { 
    display: flex; 
    border-top: 1px solid #F4B41A; 
    border-bottom: 1px solid #F4B41A;
    border-left: 1px solid #F4B41A;
    border-right: 1px solid #F4B41A;
    margin-bottom: 12px;  
    padding: 6px 0;       
    background: #fff;
  }
  .office-col { 
    flex: 1; 
    padding: 0 15px;
    background: #ffffff;
  }
  .office-col.left-office { 
    background: #fffbf0; 
    border-right: 1px solid #F4B41A;
  }
  
  .office-heading { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; color: #000; margin-bottom: 6px; }
  .office-heading .flag-icon { 
    width: 26px; 
    height: 26px; 
    object-fit: cover; 
    border-radius: 40%; 
    border: 2px solid #000; 
    display: inline-block; 
  }
  .office-detail-wrapper { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-size: 9px; }
  .office-address { flex: 1.1; display: flex; flex-direction: column; gap: 3px; }
  .office-contacts { flex: 0.9; display: flex; flex-direction: column; gap: 3px; }
  
  .contact-item { display: flex; align-items: center; gap: 5px; }
  .contact-icon { width: 11px; height: 11px; fill: #000; flex-shrink: 0; }

  /* INVOICE TO AND WATERMARK GRID */
  .details-grid { 
    display: flex; 
    justify-content: space-between;
    margin-bottom: 15px;   
    align-items: flex-start;
    min-height: 0;
  }
  .invoice-to-box { 
    width: 50%; 
    border: 1px solid #d8d8d8;
    border-radius: 6px;
    padding: 10px 12px;
    background: #fff;
  } 
  
  .box-header { 
    background: #F4B41A; color: #000; font-weight: 400; font-size: 10px; 
    padding: 5px 12px; text-transform: uppercase; width: 110px; 
    clip-path: polygon(0 0, 85% 0, 100% 100%, 0 100%); margin-bottom: 10px;
  }
  .box-content { display: flex; flex-direction: column; gap: 6px; }
  .info-line { display: flex; align-items: center; font-size: 10px; }
  .info-line .label { width: 95px; font-weight: 600; }
  .info-line .dots { width: 15px; color: #777; }
  .info-line .value-line { flex: 1; border-bottom: 1px solid #ccc; height: 16px; padding-left: 5px; font-weight: 500; }

  .invoice-cart-box { 
  width: 45%; 
  height: 130px;      
  overflow: visible;
  display: flex; 
  justify-content: center; 
  align-items: flex-start;
  }
  .cart-watermark { 
  width: 170px; 
  object-fit: contain;
  margin-top: -8px; 
}

  /* ITEMS TABLE */
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; } 
  thead tr { background: #F4B41A; }
  thead th { padding: 6px 8px; font-size: 10px; font-weight: 400; color: #000; 
  text-transform: uppercase; border: 1px solid #ccc; 
  text-align: center;
}
  thead th.center { text-align: center; }
  thead th.right { text-align: right; }
  
  tbody tr { border-bottom: 1px solid #ccc; }
  tbody td { padding: 6px 8px; font-size: 10px; vertical-align: middle; border: 1px solid #ccc; height: 26px; }
  td.center { text-align: center; }
  td.right { text-align: right; }
  td.total-cell { font-weight: 500; }
  td.item-name { font-weight: 500; }

  /* TOTALS & SIGNATURES SECTIONS */
  .bottom-pricing-container { display: flex; flex-direction: column; align-items: flex-end; width: 100%; margin-bottom: 12px; }
  .financial-totals-block { 
    width: 300px; 
    display: flex; 
    flex-direction: column; 
    gap: 6px; 
    margin-bottom: 12px;
    border: 1px solid #d8d8d8;
    border-radius: 6px;
    padding: 10px 12px;
  }
  .totals-row { display: flex; align-items: center; font-size: 9.5px; font-weight: 700; color: #000; }
  .totals-row .label { width: 120px; text-transform: uppercase; }
  .totals-row .dots { width: 20px; text-align: center; }
  .totals-row .value-line { flex: 1; border-bottom: 1px solid #ccc; height: 16px; text-align: right; padding-right: 5px; font-weight: 500; }
  
  .totals-row.grand-due { background: #F4B41A; padding: 6px 8px; margin-top: 4px; 
  justify-content: center; /* add this */
}
  .totals-row.grand-due .label { width: 130px; font-weight: 400; }
  .totals-row.grand-due .dots { width: 15px; }
  .totals-row.grand-due .value-line { border-bottom: none; font-weight: 700; height: auto; padding-right: 0; }

  .signatures-row { width: 100%; display: flex; justify-content: flex-end; align-items: center; gap: 20px; margin-top: 8px; padding-right: 5px; }
  .sign-column { width: 160px; display: flex; flex-direction: column; gap: 5px; font-size: 9px; }
  .sign-title { font-weight: 700; color: #F4B41A; margin-bottom: 2px; }
  .sign-field { display: flex; align-items: center; }
  .sign-field .lbl { width: 35px; }
  .sign-field .ln { flex: 1; border-bottom: 1px solid #ccc; height: 12px; }

  /* CARDS INFO BLOCK */
  .info-boxes-row { display: flex; gap: 15px; margin-bottom: 12px; }
  .footer-info-card { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 8px 10px; background: #fff; }

  .card-header-container {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 8px;
  }
  .card-header-icon-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #F4B41A;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .card-header-icon {
    width: 13px;
    height: 13px;
    fill: #fff;
  }
  .card-header-label {
    background: linear-gradient(135deg, #F9C846, #F4B41A);
    color: #000;
    padding: 5px 16px 5px 16px;
    font-weight: 400;
    font-size: 9.5px;
    font-type: times new roman;
    text-transform: uppercase;
    border-radius: 4px;
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    margin-left: -10px;
  }
  .card-body-text { font-size: 8.5px; color: #000; display: flex; flex-direction: column; gap: 3px; }
  .card-body-text ol { padding-left: 12px; }
  .card-body-text ol li { margin-bottom: 2px; line-height: 1.3; }
  .card-body-text .bank-row { display: flex; }
  .card-body-text .bank-label { width: 90px; font-weight: 600; }
  .card-body-text .bank-dots { width: 15px; }

  /* SOLID FOOTER BANNER */
  .bottom-yellow-banner { background: #F4B41A; color: #000; padding: 8px; text-align: center; font-size: 10px; font-weight: 700; }
</style>
</head>
<body>
<div class="page">

  <!-- TOP HEADER -->
  <div class="brand-container">
    <div class="logo-area">
      <img class="brand-logo" src="/images/HOC.png" alt="House of Cambridge logo" />
      <div class="brand-text">
        <div class="brand-title">House Of Cambridge</div>
        <div class="brand-tagline">Global Perspective. Local Expertise. Lasting Value.</div>
      </div>
    </div>
    <div class="main-invoice-title">
      <h1>Invoice</h1>
      <div class="top-mini-meta">
        <div><span class="label">Invoice No</span><span class="dots">:</span><span class="line-input">${orderNum}</span></div>
        <div><span class="label">Invoice Date</span><span class="dots">:</span><span class="line-input">${invoiceDate}</span></div>
        <div><span class="label">Due Date</span><span class="dots">:</span><span class="line-input">${dueDate}</span></div>
      </div>
    </div>
  </div>

  <!-- OFFICE COLUMNS -->
  <div class="offices-row">
    <!-- SRI LANKA -->
    <div class="office-col left-office">
      <div class="office-heading">
        <img class="flag-icon" src="/images/LK_flag.png" alt="Sri Lanka flag" />
        <span>SRI LANKAN OFFICE</span>
      </div>
      <div class="office-detail-wrapper">
        <div class="office-address">
          <strong>House of Cambridge (Pvt) Ltd</strong>
          <span>No 63, Old Road, Pannipitiya.</span>
        </div>
        <div class="office-contacts">
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24"><path d="M22 4H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 3.51L12 13.59 2.4 7.51C2.15 7.36 2 7.1 2 6.8c0-.55.45-1 1-1 .17 0 .33.05.47.14L12 11.24l8.53-5.3c.14-.09.3-.14.47-.14.55 0 1 .45 1 1 0 .3-.15.56-.4.71z"/></svg>
            <span>info@houseofcambridge.com</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 20 20"><path d="M10 20a10 10 0 1 1 0-20a10 10 0 0 1 0 20m7.75-8a8 8 0 0 0 0-4h-3.82a29 29 0 0 1 0 4zm-.82 2h-3.22a14.4 14.4 0 0 1-.95 3.51A8.03 8.03 0 0 0 16.93 14m-8.85-2h3.84a24.6 24.6 0 0 0 0-4H8.08a24.6 24.6 0 0 0 0 4m.25 2c.41 2.4 1.13 4 1.67 4s1.26-1.6 1.67-4zm-6.08-2h3.82a29 29 0 0 1 0-4H2.25a8 8 0 0 0 0 4m.82 2a8.03 8.03 0 0 0 4.17 3.51c-.42-.96-.74-2.16-.95-3.51zm13.86-8a8.03 8.03 0 0 0-4.17-3.51c.42.96.74 2.16.95 3.51zm-8.6 0h3.34c-.41-2.4-1.13-4-1.67-4S8.74 3.6 8.33 6M3.07 6h3.22c.2-1.35.53-2.55.95-3.51A8.03 8.03 0 0 0 3.07 6"/></svg>
            <span>https://houseofcambridge.co.uk/</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <span>011 2 847 847</span>
          </div>
          <div class="contact-item" style="padding-left:16px;">
            <span>076 4 604 227</span>
          </div>
        </div>
      </div>
    </div>

    <!-- UK HO -->
    <div class="office-col">
      <div class="office-heading">
        <img class="flag-icon" src="/images/UK_flag.png" alt="UK flag" />
        <span>HEAD OFFICE - UK</span>
      </div>
      <div class="office-detail-wrapper">
        <div class="office-address">
          <strong>House of Cambridge Limited</strong>
          <span>Unit 2A, 2nd Floor, Cavendish House, 369 Burnt Oak Broadway, Edgware HA8 5AW, United Kingdom.</span>
        </div>
        <div class="office-contacts">
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24"><path d="M22 4H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 3.51L12 13.59 2.4 7.51C2.15 7.36 2 7.1 2 6.8c0-.55.45-1 1-1 .17 0 .33.05.47.14L12 11.24l8.53-5.3c.14-.09.3-.14.47-.14.55 0 1 .45 1 1 0 .3-.15.56-.4.71z"/></svg>
            <span>info@houseofcambridge.com</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 20 20"><path d="M10 20a10 10 0 1 1 0-20a10 10 0 0 1 0 20m7.75-8a8 8 0 0 0 0-4h-3.82a29 29 0 0 1 0 4zm-.82 2h-3.22a14.4 14.4 0 0 1-.95 3.51A8.03 8.03 0 0 0 16.93 14m-8.85-2h3.84a24.6 24.6 0 0 0 0-4H8.08a24.6 24.6 0 0 0 0 4m.25 2c.41 2.4 1.13 4 1.67 4s1.26-1.6 1.67-4zm-6.08-2h3.82a29 29 0 0 1 0-4H2.25a8 8 0 0 0 0 4m.82 2a8.03 8.03 0 0 0 4.17 3.51c-.42-.96-.74-2.16-.95-3.51zm13.86-8a8.03 8.03 0 0 0-4.17-3.51c.42.96.74 2.16.95 3.51zm-8.6 0h3.34c-.41-2.4-1.13-4-1.67-4S8.74 3.6 8.33 6M3.07 6h3.22c.2-1.35.53-2.55.95-3.51A8.03 8.03 0 0 0 3.07 6"/></svg>
            <span>https://houseofcambridge.co.uk/</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <span>44 (0)20 3371 178</span>
          </div>
          <div class="contact-item" style="padding-left:16px;">
            <span>44 (0)73 8639 1286</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- INVOICE TO SECTION -->
  <div class="details-grid">
    <div class="invoice-to-box">
      <div class="box-header">Invoice To</div>
      <div class="box-content">
        <div class="info-line"><span class="label">Client Name</span><span class="dots">:</span><span class="value-line">${safeName}</span></div>
        <div class="info-line"><span class="label">Company Name</span><span class="dots">:</span><span class="value-line">${safeCompany}</span></div>
        <div class="info-line"><span class="label">Address</span><span class="dots">:</span><span class="value-line">${line1}</span></div>
        <div class="info-line"><span class="label"></span><span class="dots"></span><span class="value-line">${line2}</span></div>
        <div class="info-line"><span class="label"></span><span class="dots"></span><span class="value-line"></span></div>
        <div class="info-line"><span class="label">Email</span><span class="dots">:</span><span class="value-line">${safeEmail}</span></div>
        <div class="info-line"><span class="label">Phone</span><span class="dots">:</span><span class="value-line">${safePhone}</span></div>
      </div>
    </div>
    
    <div class="invoice-cart-box">
      ${cartDataUrl ? `<img src="${cartDataUrl}" alt="Shopping cart" class="cart-watermark" />` : ''}
    </div>
  </div>

  <!-- LINE ITEMS TABLE -->
  <table>
    <thead>
      <tr>
        <th style="width: 60px; font-weight: 700;" class="center">NO.</th>
        <th>DESCRIPTION</th>
        <th style="width: 70px;" class="center">Qty</th>
        <th style="width: 170px;" class="right">UNIT PRICE</th>
        <th style="width: 150px;" class="right">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${fillerRows}
    </tbody>
  </table>

  <!-- TOTALS AND SIGNATURES -->
  <div class="bottom-pricing-container">
    <div class="financial-totals-block">
      <div class="totals-row">
        <span class="label">SUBTOTAL</span><span class="dots">:</span><span class="value-line">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="totals-row">
        <span class="label">DISCOUNT</span><span class="dots">:</span><span class="value-line">${discount > 0 ? discount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</span>
      </div>
      <div class="totals-row">
        <span class="label">TAX / VAT (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;%)</span><span class="dots">:</span><span class="value-line">${tax > 0 ? tax.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</span>
      </div>
      <div class="totals-row">
        <span class="label">Delivery Charges</span><span class="dots">:</span><span class="value-line">${shipping > 0 ? shipping.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</span>
      </div>
      <div class="totals-row grand-due">
        <span class="label">TOTAL AMOUNT DUE</span><span class="dots">:</span><span class="value-line">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="signatures-row">
      <div class="sign-column">
        <div class="sign-title">Approved By</div>
        <div class="sign-field"><span class="lbl">Name</span><span class="ln"></span></div>
        <div class="sign-field"><span class="lbl">Date</span><span class="ln"></span></div>
      </div>
      <div style="width: 1px; height: 40px; background-color: #F4B41A;"></div>
      <div class="sign-column">
        <div class="sign-title">Customer's Signature</div>
        <div class="sign-field"><span class="lbl">Name</span><span class="ln"></span></div>
        <div class="sign-field"><span class="lbl">Date</span><span class="ln"></span></div>
      </div>
    </div>
  </div>

  <!-- BOTTOM INFOCARDS -->
  <div class="info-boxes-row">
    <!-- T&C -->
    <div class="footer-info-card">
      <div class="card-header-container">
        <div class="card-header-icon-badge">
          <svg class="card-header-icon" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        </div>
        <span class="card-header-label">TERMS &amp; CONDITIONS</span>
      </div>
      <div class="card-body-text">
        <ol>
          <li>Payment is due within the agreed credit period started on the invoice (10 Days).</li>
          <li>Ownership of goods remains with House of Cambridge until full payment has been received.</li>
          <li>Any discrepancies, shortages, or damages must be reported within 48 hours of receipt.</li>
          <li>Electronic invoices are deemed original documents and are legally valid.</li>
          <li>By making payment against this invoice, the customer agrees to these terms and conditions.</li>
        </ol>
      </div>
    </div>
    
    <!-- BANK DETAILS -->
    <div class="footer-info-card">
      <div class="card-header-container">
        <div class="card-header-icon-badge">
          <svg class="card-header-icon" viewBox="0 0 24 24"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h17V6l-9.5-5z"/></svg>
        </div>
        <span class="card-header-label">BANK ACCOUNT DETAILS</span>
      </div>
      <div class="card-body-text" style="gap: 5px;">
        <div class="bank-row"><span class="bank-label">Account Name</span><span class="bank-dots">:</span><span>House of Cambridge Limited</span></div>
        <div class="bank-row"><span class="bank-label">Bank Name</span><span class="bank-dots">:</span><span>HSBC UK Bank plc</span></div>
        <div class="bank-row"><span class="bank-label">Account Number</span><span class="bank-dots">:</span><span>12345678</span></div>
        <div class="bank-row"><span class="bank-label">Sort Code</span><span class="bank-dots">:</span><span>40-05-30</span></div>
        <div class="bank-row"><span class="bank-label">IBAN</span><span class="bank-dots">:</span><span>GB12HBUK40053012345678</span></div>
        <div class="bank-row"><span class="bank-label">SWIFT/BIC</span><span class="bank-dots">:</span><span>HBUKGB4B</span></div>
      </div>
    </div>
  </div>

  <!-- FOOTER GRATITUDE BANNER -->
  <div class="bottom-yellow-banner">
    Thank you for your business. We truly appreciate the opportunity to work with you.
  </div>

</div>
</body>
</html>`;

  const container = document.createElement('div');
  container.style.cssText = [
    'position:absolute',
    'left:-9999px',
    'top:0',
    'width:840px',
    'background:#fff',
  ].join(';');
  container.innerHTML = html;
  document.body.appendChild(container);

  const pageEl = container.querySelector('.page');

  html2pdf()
    .set({
      margin:      [4, 4, 4, 4],
      filename:    `Invoice-${orderNum}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale:           2.0,
        useCORS:         true,
        logging:         false,
        backgroundColor: '#ffffff',
        windowWidth:     840,
      },
      jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    })
    .from(pageEl)
    .save()
    .then(() => document.body.removeChild(container))
    .catch((err) => {
      console.error('Invoice PDF error:', err);
      if (document.body.contains(container)) document.body.removeChild(container);
    });
}

export const generateInvoicePDF = (invoice) => {
  return downloadInvoice(invoice);
};