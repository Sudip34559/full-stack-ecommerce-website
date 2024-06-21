import twilio from "twilio";
import { sendEmail } from "../services/email.service.js";
const accountSid = process.env.twilio_account_sid;
const authToken = process.env.twilio_auth_token;
const number = process.env.twilio_phone_number;
const client = twilio(accountSid, authToken);

// Function to send a message
async function sendMessage(phoneNumber, messageBody) {
  try {
    // Send message via Twilio SMS
    const message = await client.messages.create({
      body: messageBody,
      from: number,
      to: phoneNumber,
    });
    console.log(`Message sent to ${phoneNumber}: ${messageBody}`);
    return { success: true, message: "Message sent successfully" };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Error sending message" };
  }
}
const sendOTP = async (phoneNumber, email, session) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  session.otp = {
    otp,
    expires: Date.now() + 10 * 60 * 1000,
  };
  const messageBody = `Your OTP is ${otp}`;
  await sendMessage(phoneNumber, messageBody);
  messageBody = `Your OTP is ${otp}`;
  const sender = `abcd store`;
  const recipient = email;
  const subject = "OTP verification";
  const body = messageBody;
  await sendEmail(sender, recipient, subject, body);
};

export { sendMessage, sendOTP };
