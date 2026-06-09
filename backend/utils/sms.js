const axios = require('axios');
const logger = require('./logger');

const sendSMS = async ({ to, message }) => {
  const provider = process.env.SMS_PROVIDER || 'africastalking';
  try {
    if (provider === 'africastalking') {
      return await sendAfricaSTalking(to, message);
    } else if (provider === 'twilio') {
      return await sendTwilio(to, message);
    }
    throw new Error(`Unknown SMS provider: ${provider}`);
  } catch (error) {
    logger.error(`SMS sending failed to ${to}: ${error.message}`);
    throw error;
  }
};

const sendAfricaSTalking = async (to, message) => {
  const url = process.env.AT_ENVIRONMENT === 'production'
    ? 'https://api.africastalking.com/version1/messaging'
    : 'https://api.sandbox.africastalking.com/version1/messaging';

  const response = await axios.post(
    url,
    new URLSearchParams({
      username: process.env.AT_USERNAME || 'sandbox',
      to: to,
      message: message,
      from: process.env.AT_SENDER_ID || 'ISOKOHUB',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': process.env.AT_API_KEY,
        'Accept': 'application/json',
      },
    }
  );

  logger.info(`SMS sent to ${to}: ${response.data.SMSMessageData?.Message || 'Success'}`);
  return response.data;
};

const sendTwilio = async (to, message) => {
  const twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const response = await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to,
  });

  logger.info(`SMS sent to ${to} via Twilio: ${response.sid}`);
  return response;
};

const sendOTP = async (phone, otp) => {
  const message = `Your ISOKOHUB verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`;
  return sendSMS({ to: phone, message });
};

const sendOrderUpdate = async (phone, orderNumber, status) => {
  const statusMessages = {
    confirmed: `Your ISOKOHUB order #${orderNumber} has been confirmed. We'll start processing it soon.`,
    shipped: `Great news! Your ISOKOHUB order #${orderNumber} has been shipped! Track it in your account.`,
    delivered: `Your ISOKOHUB order #${orderNumber} has been delivered. Enjoy your purchase!`,
    cancelled: `Your ISOKOHUB order #${orderNumber} has been cancelled. Contact support for refunds.`,
  };

  const message = statusMessages[status] || `Your ISOKOHUB order #${orderNumber} status updated to: ${status}`;
  return sendSMS({ to: phone, message });
};

const sendDeliveryOTP = async (phone, otp) => {
  const message = `Your ISOKOHUB delivery OTP is: ${otp}. Share this with the delivery driver to receive your package.`;
  return sendSMS({ to: phone, message });
};

module.exports = {
  sendSMS,
  sendOTP,
  sendOrderUpdate,
  sendDeliveryOTP,
};
