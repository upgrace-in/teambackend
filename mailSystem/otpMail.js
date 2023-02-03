const Sendmail = require('./sendMail.js')

async function otpMail(toMail, subject, otp) {

    html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="utf-8" />
    
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link
            href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,500;0,700;1,300;1,400;1,500&display=swap"
            rel="stylesheet">
        <title>Masterslease - Apply Online. Quick, Easy</title>
    </head>
    
    <body style="font-family: 'Roboto';">
    
        <div class="resultPage container text-center mx-auto"
            style="width: 80%; margin-right: auto;  margin-left: auto; text-align: center;">
            <h1>YOUR <span style="color: #0fe205;">OTP</span> IS: <span style="color: #0fe205;">`+ otp + `</span></h1>
            <p style="text-align: left; margin-top: 50px;">
                ©️ Masters Lease 2023 | Dallas, Texas | MastersLease.com
            </p>
        </div>
    
    </body>
    
    </html>`

    return await Sendmail(toMail, subject, html)
}

module.exports = otpMail
