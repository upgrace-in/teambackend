const Sendmail = require('./sendMail.js')

function mailForgotPassword(toMail, subject, data) {

    html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;800&amp;display=swap"
    </head>
    
    <body style="padding: 20px; font-family: 'Roboto';
    background: #e5e1e1;
    color: rgb(80, 80, 80);">
        <div className="container mx-auto text-center" style="margin-right: auto; margin-left: auto; text-align: center;">
            <div className="card col-md-4 mx-auto text-center mt-4" style="width: 350px; margin-right: auto; margin-left: auto; text-align: center;
            padding: 5px !important;
            background: #fff !important;
            border-radius: 20px;
            margin-top: 10px;">
                <p>
                    <span className="fw-7" style="font-weight: 700;
                    font-size: 1.7rem;">`+ data.randCode`</span>
                </p>
                <br/><br/>
            </div>
        </div>
    </body>
    
    </html>`

    Sendmail(toMail, subject, html)
}

module.exports = mailForgotPassword
