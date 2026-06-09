const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

const initializeTransporter = () => {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!transporter) {
    initializeTransporter();
  }

  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'ISOKOHUB'}" <${process.env.EMAIL_FROM || 'noreply@isokohub.com'}>`,
      to,
      subject,
      html,
      text,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed to ${to}: ${error.message}`);
    throw error;
  }
};

const sendWelcomeEmail = async (user, tenantName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { padding: 30px; background: #f9f9f9; }
      .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>Welcome to ${tenantName || 'ISOKOHUB'}!</h1></div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>Thank you for joining ${tenantName || 'ISOKOHUB'}! We're excited to have you on board.</p>
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>Browse millions of products</li>
            <li>Create your wishlist</li>
            <li>Track your orders in real-time</li>
            <li>Enjoy secure payments</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/auth/login" class="button">Get Started</a>
          </div>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The ISOKOHUB Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ISOKOHUB. All rights reserved.</p>
          <p>This email was sent to ${user.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Welcome to ${tenantName || 'ISOKOHUB'}!`,
    html,
    text: `Welcome to ${tenantName || 'ISOKOHUB'}! Your account has been created successfully.`,
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { padding: 30px; background: #f9f9f9; }
      .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>Password Reset Request</h1></div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ISOKOHUB. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request - ISOKOHUB',
    html,
    text: `Reset your password here: ${resetUrl}`,
  });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.currency} ${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.currency} ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { padding: 30px; background: #f9f9f9; }
      .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { padding: 10px; background: #f0f0f0; text-align: left; }
      .total-row { font-weight: bold; font-size: 18px; }
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>Order Confirmed! 🎉</h1></div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>Your order has been placed successfully!</p>
          <div class="order-info">
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Delivery Address:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.country}</p>
          </div>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="order-info" style="text-align: right;">
            <p><strong>Subtotal:</strong> ${order.currency} ${order.subtotal.toFixed(2)}</p>
            <p><strong>Shipping:</strong> ${order.currency} ${order.shippingFee.toFixed(2)}</p>
            <p><strong>Tax:</strong> ${order.currency} ${order.tax.toFixed(2)}</p>
            <p class="total-row"><strong>Total:</strong> ${order.currency} ${order.total.toFixed(2)}</p>
          </div>
          <p>You can track your order in real-time from your account dashboard.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ISOKOHUB. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html,
    text: `Your order ${order.orderNumber} has been confirmed. Total: ${order.currency} ${order.total.toFixed(2)}`,
  });
};

const sendVendorNotificationEmail = async (vendor, data) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { padding: 30px; background: #f9f9f9; }
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>${data.subject}</h1></div>
        <div class="content">
          <p>Hello ${vendor.storeName},</p>
          ${data.message.split('\n').map(p => `<p>${p}</p>`).join('')}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ISOKOHUB. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: vendor.email,
    subject: data.subject,
    html,
    text: data.message,
  });
};

module.exports = {
  initializeTransporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendVendorNotificationEmail,
};
