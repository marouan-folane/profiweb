const nodemailer = require('nodemailer');
const AppError = require('./AppError');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.firstName;
        this.url = url;
        this.from = `Profiweb <${process.env.EMAIL_FROM || 'no-reply@profiweb.com'}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid or other production service could be configured here
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
            port: process.env.EMAIL_PORT || 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Send the actual email
    async send(template, subject, message) {
        // 1) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2>${subject}</h2>
        <p>Hello ${this.firstName},</p>
        <p>${message}</p>
        ${this.url ? `<p><a href="${this.url}" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Click Here</a></p>` : ''}
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Profiweb Team</p>
      </div>`
        };

        // 2) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendVerificationCode(code) {
        await this.send(
            'verificationCode',
            'Your Verification Code',
            `Your verification code is: ${code}. This code is valid for 10 minutes.`
        );
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to Profiweb!', 'Welcome to our platform!');
    }
};
