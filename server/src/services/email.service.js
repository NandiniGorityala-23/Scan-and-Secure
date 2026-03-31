import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function daysUntil(date) {
  const now = new Date();
  const diff = new Date(date) - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const sendExpiryReminder = async ({ to, customerName, productName, modelNumber, expiresAt }) => {
  const days = daysUntil(expiresAt);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background: #4f46e5; padding: 36px 40px 32px; }
        .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; }
        .alert-box { background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .alert-box p { margin: 0; color: #854d0e; font-size: 14px; font-weight: 600; }
        .product-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
        .product-card .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
        .product-card .value { font-size: 15px; color: #0f172a; font-weight: 600; margin-bottom: 14px; }
        .product-card .value:last-child { margin-bottom: 0; }
        .cta { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 10px; margin-top: 8px; }
        .footer { background: #0f172a; padding: 20px 40px; text-align: center; }
        .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>OmniWarranty</h1>
          <p>Warranty expiry reminder</p>
        </div>
        <div class="body">
          <p style="color:#475569;font-size:15px;margin-bottom:20px;">Hi <strong style="color:#0f172a;">${customerName}</strong>,</p>
          <div class="alert-box">
            <p>⚠️ Your warranty expires in <strong>${days} day${days !== 1 ? 's' : ''}</strong> (${formatDate(expiresAt)})</p>
          </div>
          <div class="product-card">
            <div class="label">Product</div>
            <div class="value">${productName}</div>
            <div class="label">Model Number</div>
            <div class="value">${modelNumber}</div>
            <div class="label">Warranty Expires</div>
            <div class="value" style="color:#dc2626;">${formatDate(expiresAt)}</div>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">
            Please make note of this date. If you experience any issues with your product before the warranty expires,
            contact the manufacturer with your warranty certificate. After expiry, warranty services may not be available.
          </p>
        </div>
        <div class="footer">
          <p>OmniWarranty — Fraud-proof digital warranty management</p>
          <p style="margin-top:4px;">You received this because you registered a warranty with us.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"OmniWarranty" <${process.env.SMTP_USER}>`,
    to,
    subject: `⚠️ Your warranty for ${productName} expires in ${days} days`,
    html,
  });
};
