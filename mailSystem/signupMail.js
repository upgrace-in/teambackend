const Sendmail = require('./sendMail.js')

function signupMail(toMail, subject, liveSiteAdd) {

    
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
                <div className="col mt-4" style="margin-top: 30px;">
                    <img src="`+ liveSiteAdd + `/emailTemps/greentick.png" alt="">
                </div>
                <p>
                    <span className="fw-7" style="font-weight: 700;">Thanks for signing up.</span>
                    <br/>
                    <span>We are excited to get you going</span>
                    <br /><br />
                    <span>Don't forget to upload your leads</span>
                </p>
                <br/>
                <a href="`+ liveSiteAdd + `/user" target="_blank" className="col-md-6 mx-auto text-center btn btn-primary" style="outline: none;
                border: none;
                background: #5f1cb7 !important;
                font-weight: 600;
                color: #fff !important;
                border-radius: 10px;
                padding: 15px;
                background: #fff9;
                margin-top: 10px;
                text-decoration: none;">Upload leads now</a>
                <div className="col mt-4" style="margin-top: 30px;">
                    <img src="`+ liveSiteAdd + `/emailTemps/logoBlack.png" alt="">
                </div>
                <br/><br/>
            </div>
        </div>
    </body>
    
    </html>`

    Sendmail(toMail, subject, html)
}

module.exports = signupMail
