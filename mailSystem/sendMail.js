const nodemailer = require('nodemailer');
require('dotenv').config()

let userEmail = 'support@teamagentadvantage.com'
let pass = process.env.EMAILPWORD

function Sendmail(toEmail, subject, html) {
    let mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: userEmail,
            pass: pass
        }
    });

    let mailDetails = {
        from: 'support@teamagentadvantage.com',
        to: toEmail,
        subject: subject,
        html: html
    };

    mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
            console.log('Error Occurs');
        } else {
            console.log('Email sent successfully');
        }
    });
}

module.exports = Sendmail
