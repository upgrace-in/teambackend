const Sendmail = require('./sendMail.js')
var dateTime = require('node-datetime');

function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1);
}

function formatPhone(phone) {
    return "(" + phone.substring(0, 3) + ")" + " " + phone.substring(3, 6) + "-" + phone.substring(6, 11)
}

function mailToAdmin(toMail, subject, data, liveSiteAdd) {
    var dt = dateTime.create();
    var realTimeDateTime = dt.format('Y-m-d H:M:S');

    if (data.clientReady !== undefined) {
        clientActivelyMsg = `<p>
            <span style="color: #fff">Best date and time to call is</span>
            <br />
            <span className="fw-7" style="font-weight: 700;
            font-size: 1.5rem;">On `+ data.clientReady + `</span>
        </p>`
    } else {
        clientActivelyMsg = `<p className="fw-7" style="font-weight: 700;
        font-size: 1.5rem; color: #fff;">
            <span id="userFname">`+ capitalize(data.name) + `</span>, would like you to call her first
            <br/>
            <a style="color: #f277e7 !important;" href="tel:`+ formatPhone(data.phoneNumber) + `"><span id="userFname" style="color: #f277e7 !important;">` + data.phoneNumber + `</span></a>
        </p>`
    }
    html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    </head>
    
    <body style="padding-top: 20px; padding-bottom: 30px; font-family: 'Roboto';
    background: #825ea7 !important;
    color: #fff !important;
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;">
        <div className="container mx-auto text-center" style="width: 80%; text-align: center; margin-right: auto;
        margin-left: auto;">
            <div className="col mt-4" style="margin-top: 20px;">
                <img style="width: 20%" src="`+ liveSiteAdd + `/emailTemps/logoWhite.png" alt="">
            </div>
            <div className="col mt-4" style="margin-top: 20px;">
                <img src="`+ liveSiteAdd + `/emailTemps/tick.png" alt="">
            </div>
            <p style="color: #fff">
                On <span id="dateTime" style="color: #fff;">`+ realTimeDateTime + `</span>
                <br />
                <span id="userName" style="color: #fff;">`+ capitalize(data.name) + ` </span>registered a new lead.
            </p>
            <table className="table table-striped" style="color: #fff; margin-right: auto; margin-left: auto; text-align: center;">
                <tr>
                    <td style="padding: 5px; background: #79559d;
                                color: #fff;
                                border-top: 1px solid #dee2e6;" 
                                id="leadName">`+ capitalize(data.fname) + ' ' + capitalize(data.lname) + `</td>
                    <td style="padding: 5px; background: #79559d;
                                color: #f277e7 !important;
                                border-top: 1px solid #dee2e6;" 
                                id="leadEmail">`+ data.inputEmail + `</td>
                    <td style="padding: 5px; background: #79559d;
                                color: #fff;
                                border-top: 1px solid #dee2e6;" 
                                id="leadPhone">`+ formatPhone(data.inputPhone) + `</td>
                    <td style="padding: 5px; background: #79559d;
                                color: #fff;
                                border-top: 1px solid #dee2e6;" 
                                id="loanAmount">$`+ data.loanAmt + `</td>
                    <td style="padding: 5px; background: #79559d;
                                color: #fff;
                                border-top: 1px solid #dee2e6;" 
                                id="credits">`+ data.credits + `</td>
                </tr>
            </table>
            <br />
            <!-- My Client is Ready for Call -->
            `+ clientActivelyMsg + `
            <br />
            <a href="`+ liveSiteAdd + `/user" target="_blank" 
            className="btn btn-light" 
            style="border-radius: 10px;
            padding: 15px;
            background: #fff9;
            text-decoration: none;
            font-weight: 600;
            color: #2a084d !important;">View lead</a>
        </div>
    </body>
    
    </html>`

    Sendmail(toMail, subject, html)
}

module.exports = mailToAdmin
