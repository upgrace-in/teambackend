const Sendmail = require('./sendMail.js')

function receiptMail(toMail, subject, data) {


    html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;800&amp;display=swap"
    </head>
    
    <body style="padding: 20px; font-family: 'Roboto';
    background: #e5e1e1;
    color: rgb(80, 80, 80);">
        <div className="container mx-auto text-center" style="margin-bottom: 10%; margin-right: auto; margin-left: auto; text-align: center;">
            <div className="card col-md-4 mx-auto text-center mt-4" style="width: 350px; margin-right: auto; margin-left: auto; text-align: center;
                padding: 5px !important;
                background: #fff !important;
                border-radius: 20px;
                margin-top: 10px; margin-bottom: 5%;">
                <p>
                    <span className="fw-7" style="font-weight: 700;">A Receipt Has Been Uploaded by `+ data.emailAddress + ` with uid: ` + data.uid + `</span>
                </p>
            </div>
        </div>
    </body>
    
    </html>`

    Sendmail(toMail, subject, html)
}

module.exports = receiptMail
