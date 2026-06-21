const nodemailer = require('nodemailer');

exports.submitContactMessage = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required: name, email, message.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (message.trim().length < 10) {
        return res.status(400).json({ message: 'Message must be at least 10 characters long.' });
    }

    try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
            });

            await transporter.sendMail({
                from: `"${name}" <${email}>`,
                to: process.env.FROM_EMAIL || 'ms9949057@gmail.com',
                subject: `[CodeCraft Contact] New message from ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #6C5CE7, #FF00FF); padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">New Contact Message</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                            <p><strong>Message:</strong></p>
                            <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #6C5CE7;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div style="padding: 15px; text-align: center; color: #aaa; font-size: 12px;">
                            Sent from CodeCraft Platform Contact Form
                        </div>
                    </div>
                `
            });

            await transporter.sendMail({
                from: `"CodeCraft" <${process.env.FROM_EMAIL || 'noreply@craftcode.com'}>`,
                to: email,
                subject: 'We received your message — CodeCraft',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #6C5CE7, #FF00FF); padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">Thank you, ${name}!</h2>
                        </div>
                        <div style="padding: 30px; text-align: center;">
                            <p style="font-size: 16px; color: #333;">We've received your message and will get back to you as soon as possible.</p>
                            <p style="color: #666; font-size: 14px;">Your message: <em>"${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"</em></p>
                        </div>
                    </div>
                `
            });
        }

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(200).json({
            success: true,
            message: 'Your message has been received. We will contact you soon.'
        });
    }
};
