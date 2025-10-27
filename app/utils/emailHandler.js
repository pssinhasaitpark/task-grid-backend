import nodemailer from "nodemailer";


export const sendPasswordResetSuccessEmail = async (email, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TaskGrid Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Your TaskGrid Password Has Been Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #7CB3F5; padding: 20px; text-align: center; color: white;">
            <h1>TaskGrid</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Password Reset Successful</h2>
            <p>Hello ${name},</p>
            <p>Your TaskGrid password has been successfully reset.</p>
            <p>If you did not request this change, please contact our support team immediately.</p>
            <p>Best regards,<br/>The TaskGrid Team</p>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TaskGrid. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hello ${name},\n\nYour TaskGrid password has been successfully reset.\n\nIf you did not request this change, please contact our support team immediately.\n\nBest regards,\nThe TaskGrid Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset success email sent to ${email}`);
  } catch (err) {
    console.error("Error sending password reset success email:", err);
    throw new Error("Failed to send password reset success email");
  }
};


export const sendApprovalEmail = async (email, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TaskGrid Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Your TaskGrid Provider Account is Approved!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #7CB3F5; padding: 20px; text-align: center; color: white;">
            <h1>TaskGrid</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Congratulations, ${name}!</h2>
            <p>Your provider account on TaskGrid has been approved by the admin.</p>
            <p>You can now start offering your services to customers.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br/>The TaskGrid Team</p>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TaskGrid. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hello ${name},\n\nYour provider account on TaskGrid has been approved by the admin. You can now start offering your services to customers.\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nThe TaskGrid Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${email}`);
  } catch (err) {
    console.error("Error sending approval email:", err);
    throw new Error("Failed to send approval email");
  }
};


export const sendOTPEmail = async (email, name, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"TaskGrid Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Your TaskGrid OTP for Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #7CB3F5; padding: 20px; text-align: center; color: white;">
            <h1>TaskGrid</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Password Reset OTP</h2>
            <p>Hello ${name || ""},</p>
            <p>You have requested to reset your password. Please use the OTP below to proceed:</p>
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 24px; letter-spacing: 4px; font-weight: bold; color: #333;">${otp}</p>
            </div>
            <p>This OTP is valid for the next <b>10 minutes</b>.</p>
            <p>If you did not request this, please ignore this email or contact support immediately.</p>
            <p>Best regards,<br/>The TaskGrid Team</p>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TaskGrid. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hello ${name || ""},\n\nYou requested a password reset. Your OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email or contact support.\n\nBest regards,\nThe TaskGrid Team`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new Error("Failed to send OTP email");
  }
};
