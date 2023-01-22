const Sendmail = require('./sendMail.js')

function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1);
}

function creditMail(toMail, subject, data, liveSiteAdd) {

    html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    </head>
    
    <body style="padding-top: 10px; padding-bottom: 30px; font-family: 'Roboto';
        background: #e5e1e1 !important;
        color: #fff !important;
        margin: 0;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;">
        <div className="container mx-auto text-center"
            style="width: 80%; margin-top: 2%; text-align: center; margin-right: auto; margin-left: auto;">
            <h1 style="text-align: left; color: #000; margin: 0; padding: 0; font-size: 2rem; font-weight: 700;">Hey `+ capitalize(data.name) + `!</h1>
            <br/>
            <div style="display: flex; background: #fff !important; border-radius: 10px;">
                <div style="width: 70%">
                    <div style="text-align: center; margin-right: auto; margin-left: auto; margin-top: 2%;">
                        <h1 style="color: #606060; margin: 0; padding: 0; font-size: 3rem; font-weight: 700;">Guess What?
                        </h1>
                        <span style="color: #606060;  margin: 0; padding: 0;">You Have Credits for Marketing</span>
                        <br /><br />
                        <div
                            style="background: #5f1cb7; width: 50%; border-radius: 20px; margin-left: auto; margin-right: auto; text-align: center;">
                            <h1 style="margin:0; color: white; font-size: 4rem;">$`+ data.credits + `</h1>
                        </div>
                        <div
                            style="display: flex; margin-top: 2%; width: 50%; margin-left: auto; margin-right: auto; text-align: center;">
                            <div style="width: 50%; margin: 10px;">
                                <a type="button".target="_blank" href="`+ liveSiteAdd + `/user/"
                                    style="text-decoration: none; color: #606060 !important; border-radius: 20px; background: #e5e1e1; padding: 10px; outline: 0;">Login</a>
                            </div>
                            <div style="width: 50%; margin: 10px;">
                                <a type="button".target="_blank" href="`+ liveSiteAdd + `/user/"
                                    style="text-decoration: none; color: #606060 !important; border-radius: 20px; background: #e5e1e1; padding: 10px; outline: 0;">Add
                                    Receipt</a>
                            </div>
                        </div>
                        <div style="padding: 20px;">
                            <p style="color: #606060;">
                                Don't let these valuable credits go to waste! Be sure to take advantage of
                                them and use them to enhance your marketing efforts and grow your
                                business.
                            </p>
                            <br />
                            <p style="color: #606060;">
                                If you have any questions or need assistance, please don't hesitate to
                                reach out to us. We're here to help you succeed.
                            </p>
                        </div>
                        <div style="margin: 3%;">
                            <img style="display: block;
                            max-width: 100%;
                            height: auto;
                            width: 20%;" src="`+ liveSiteAdd + `/emailTemps/logoGrey.png" />
                        </div>
                    </div>
                </div>
                <div style="width: 30%; padding: 10px;">
                    <img style="display: block;
                    max-width: 100%;
                    height: 100%;" src="`+ liveSiteAdd + `/emailTemps/creditEmail.png" />
                </div>
            </div>
        </div>
    </body>
    </html>`

    Sendmail(toMail, subject, html)
}

module.exports = creditMail
