const express = require('express')
const cors = require('cors')
const { db } = require('./config')
const app = express()
const fs = require('fs')
const crypto = require("crypto");
const path = require('path');

require('dotenv').config()
// Multer
const multer = require('multer')
const upload = multer({ dest: __dirname + '/images' })

const mailToAdmin = require('./mailSystem/mailAdmin')
const mailForgotPassword = require('./mailSystem/mailForgotPassword')
const mailToUser = require('./mailSystem/mailUser')
const signupMail = require('./mailSystem/signupMail')
const creditMail = require('./mailSystem/creditMail')
const receiptMail = require('./mailSystem/receiptMail')
const otpMail = require('./mailSystem/otpMail')

const User = db.collection('Users')
const Lead = db.collection('Leads')
const Receipt = db.collection('Receipts')
const OTPs = db.collection('OTPs')
const APIs = db.collection('APIs')

app.listen(process.env.PORT, () => console.log("Running"))

// Sessions
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
app.use(sessions({
    secret: crypto.randomBytes(16).toString("hex"),
    saveUninitialized: true,
    resave: false
}));
app.use(cookieParser());

app.use(express.json())
app.use(cors())



async function loginSession(req, res, data, msg) {
    try {
        // If res doesn't provide emailAddress & name then throw error
        let session
        if (data === null)
            session = null
        else
            session = req.session;
        session.userdata = data;
        res.send({ session: session, msg: msg })
    } catch (e) {
        res.send({ session: data, msg: msg })
    }
}


async function getUsers(emailAddress) {
    const snapshot = await User.where('emailAddress', '==', emailAddress).get();
    if (snapshot.empty) {
        // If user doesn't exists
        return { response: false, data: {} }
    } else {
        // User exists
        return { response: true, data: snapshot.docs[0].data() }
    }
}

async function registerOrUpdate(subject, liveSiteAdd, req, res, data, response_status) {
    try {
        await User.doc(data['emailAddress']).update(data)
        signupMail(data['emailAddress'], subject, liveSiteAdd)
        loginSession(req, res, data, response_status)
    } catch (e) {
        res.send({ session: null, msg: "Something went wrong !!!" })
    }
}

app.post('/createuser', async (req, res) => {
    const data = req.body
    // Matching if the emailAddress exists
    await getUsers(data['emailAddress'])
        .then(async (val) => {
            if (val['response'] === false) {
                // Register User
                await User.doc(data['emailAddress']).set({ ...data, credits: 0 })
                signupMail(data['emailAddress'], "Successfully Registered", process.env.liveSiteAdd)
                loginSession(req, res, data, "Successfully Registered !!!")
            } else {
                // check if its a update request
                if (data.update_it === true)
                    registerOrUpdate("Your account information has been updated successfully !!!", process.env.liveSiteAdd, req, res, { ...data, credits: 0 }, "Updated Successfully !!!")
                else
                    // Response should be Try to login 
                    loginSession(req, res, null, "User exists try to login...")
            }
        })
})

app.post('/loginuser', async (req, res) => {
    const data = req.body
    // Matching if the user exists
    await getUsers(data['emailAddress']).then(async (val) => {
        // Login user
        if (val['response'] === true) {
            // User exists Check the password
            if (data['password'] === val.data.password)
                loginSession(req, res, val['data'], 'Logging in...')
            else
                loginSession(req, res, null, 'Password unmatched !!!')
        } else {
            loginSession(req, res, null, "User doesn't exists !!!")
        }
    })
})

// Leads
app.post('/addLead', async (req, res) => {
    const data = req.body
    try {
        // Save lead
        await getUsers(data['emailAddress'])
            .then(async (val) => {
                // User.doc(data['emailAddress']).update({ credits: parseFloat(val.data.credits) + parseFloat(data.credits) })
                await Lead.doc(data.uid).set({ ...data, transaction: "OPEN" })
            });

        // To the Admin
        mailToAdmin(process.env.adminMail, "Someone Added A Lead", data, process.env.liveSiteAdd)

        if (data['offerAcceptedStatus']['selectedloanOfficer'] !== undefined) {
            // To the loan Officer
            mailToAdmin(data['offerAcceptedStatus']['selectedloanOfficer'], "New Agent Advantage Lead", data, process.env.liveSiteAdd)
        }

        // To the User
        mailToUser(data['emailAddress'], "Lead been successfully uploaded !!!", data, process.env.liveSiteAdd)

        res.send({ msg: true })

    } catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})

app.get('/', async (req, res) => {
    res.send("Hare Krishna")
});

app.get('/fetchLoanOfficers', async (req, res) => {
    const snapshot = await User.where('is_loanOfficer', '==', true).get();
    if (snapshot.empty) {
        res.send({ msg: false })
    } else {
        res.send({ msg: true, data: snapshot.docs.map(doc => doc.data()) })
    }
})

app.get('/fetchLeads', async (req, res) => {
    const data = req.query
    const snapshot = await Lead.where('emailAddress', '==', data['emailAddress']).get();
    if (snapshot.empty) {
        res.send({ msg: false })
    } else {
        let leadData = snapshot.docs.map(doc => doc.data());
        res.send({ msg: true, data: leadData })
    }
})

app.get('/checkUserExists', async (req, res) => {
    const data = req.query
    const snapshot = await User.where('emailAddress', '==', data['emailAddress']).get();
    if (snapshot.empty) {
        res.send({ msg: false })
    } else {
        let data = snapshot.docs.map(doc => doc.data());
        res.send({ msg: true, data: data })
    }
})

//Receipt
app.post('/uploadReceipt', upload.single("img"), async (req, res) => {
    try {
        const data = req.body
        const filename = req.file.filename
        await Receipt.doc(data.uid).set({ ...data, imageFile: filename, used: false }, { merge: true });
        // send email
        receiptMail(process.env.uploadedreceipt, "A Receipt Has Been Uploaded", { uid: data.uid, emailAddress: data.emailAddress })
        res.send({ msg: true })
    } catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})


app.post('/deleteReceipt', async (req, res) => {
    try {
        const data = req.body
        // Fetch the receipt
        const receipt = await Receipt.where('uid', '==', data.uid).get();

        // taking out the imageFile
        let imageFile = receipt.docs[0].data().imageFile

        if (fs.existsSync(__dirname + '/images/' + imageFile)) {
            fs.unlink(__dirname + '/images/' + imageFile, async (err) => {
                if (err) throw err
                console.log('deleted');
                // deltet he receipt
                await Receipt.doc(data.uid).delete()
            });
        } else {
            await Receipt.doc(data.uid).delete()
        }

        res.send({ msg: true })
    } catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})


app.get('/images/:imageName', (req, res) => {
    // do a bunch of if statements to make sure the user is 
    // authorized to view this image, then
    try {
        const imageName = req.params.imageName
        console.log(req.params.imageName);
        let imagePATH = __dirname + `/images/${imageName}`
        if (fs.existsSync(imagePATH)) {
            const readStream = fs.createReadStream(imagePATH)
            readStream.pipe(res)
        } else {
            throw "Image not found"
        }
    } catch (e) {
        console.log(e);
        res.status(404).send({ msg: true });
    }
})

app.get('/fetchReceipts', async (req, res) => {
    const data = req.query
    try {
        const snapshot = await Receipt.where('emailAddress', '==', data['emailAddress']).get();
        if (snapshot.empty) {
            res.send({ msg: false })
        } else {
            res.send({ msg: true, data: snapshot.docs.map(doc => doc.data()) })
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})

async function fetchAllLeads(req, res) {
    try {
        const snapshot = await Lead.get();
        if (snapshot.empty) {
            res.send({ msg: false })
        } else {
            res.send({ msg: true, data: snapshot.docs.map(doc => doc.data()) })
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
}

// Admin Console or Loan Officer
// Fetch all leads
app.get('/fetchAllLeads', async (req, res) => {
    await fetchAllLeads(req, res)
})

// Fetch all receipt
app.get('/fetchAllReceipts', async (req, res) => {
    try {
        const snapshot = await Receipt.get();
        if (snapshot.empty) {
            res.send({ msg: false })
        } else {
            res.send({ msg: true, data: snapshot.docs.map(doc => doc.data()) })
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})

// Delete any Lead
app.post('/deleteLead', async (req, res) => {
    const data = req.body
    try {
        // Deleting the lead
        await Lead.doc(data['uid']).delete();
        res.send({ msg: true })
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})

// Close any lead
app.post('/closeLead', async (req, res) => {
    const data = req.body
    try {
        const snapshot = await Lead.where('uid', '==', data.uid).get();
        if (snapshot.empty) {
            res.send({ msg: false })
        } else {
            snapshot.docs.map(async (doc) => {
                d = doc.data()
                // close the lead
                await Lead.doc(data.uid).update({ transaction: "CLOSED" })
                // find the credits acc to loanAMT
                let credits = (parseFloat(d.loanAmt) * process.env.CALCULATOR) / 100
                // add credits to the account
                await getUsers(data['emailAddress'])
                    .then(async (val) => {
                        let finalcredits = parseFloat(val.data.credits) + parseFloat(credits)
                        await User.doc(data['emailAddress']).update({ credits: finalcredits })
                    });
                res.send({ msg: true })
            })
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false, response: e })
    }
})

// Update the credit of the user
app.post('/updateCredits', async (req, res) => {
    const data = req.body
    try {
        let credits
        await getUsers(data['emailAddress'])
            .then(async (val) => {
                // Checking if he has that much credit or not
                if (parseFloat(val.data.credits) > parseFloat(data.inputRecAmt)) {
                    // Updating the credits
                    credits = parseFloat(val.data.credits) - parseFloat(data.inputRecAmt)
                    await User.doc(data['emailAddress']).update({ credits: credits })
                } else
                    throw "Insufficient fund to deduct";
            });
        // update the credit of receipt
        await Receipt.doc(data.uid).update({ inputRecAmt: data.inputRecAmt, used: true })
        res.send({ msg: true })
        // 12838
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false, response: e })
    }
})


// Revert the credit of the user
app.post('/revertReceipt', async (req, res) => {
    const data = req.body
    try {
        // fetch the amt off receipt
        const receipt = await Receipt.where('uid', '==', data.uid).get();

        let inputRecAmt = receipt.docs[0].data().inputRecAmt

        // add  it back to users credits
        await getUsers(data['emailAddress'])
            .then(async (val) => {
                // console.log(val);
                // Updating the credits
                let credits = parseFloat(val.data.credits) + parseFloat(inputRecAmt)
                await User.doc(data['emailAddress']).update({ credits: credits })
            });

        // change the status of receipt to fasle
        await Receipt.doc(data.uid).update({ used: false })
        res.send({ msg: true })
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false, response: e })
    }
})

// Fetching loan officers lead
app.get('/fetchLoanLeads', async (req, res) => {
    const data = req.query
    try {
        const snapshot = await Lead.where('offerAcceptedStatus.selectedloanOfficer', '==', data.loanOfficer).get();
        if (snapshot.empty) {
            res.send({ msg: false })
        } else {
            res.send({ msg: true, data: snapshot.docs.map(doc => doc.data()) })
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
    }
})

// Send weekly email showing them thier credits
async function sendcreditMail() {
    try {
        // Fetch the users
        const snapshot = await User.get();

        if (snapshot.empty) {
            throw new Error;
        } else {
            // Loop trough thier credits
            snapshot.docs.map(async doc => {
                data = doc.data()
                // send to creditMail
                if ((data.is_admin === false) && (data.is_loanOfficer === false) && (data.credits > 0)) {
                    creditMail(
                        data.emailAddress, "Reminder: Here ‘s how to keep track of your marketing credits!",
                        data,
                        process.env.liveSiteAdd
                    )
                }
            })
        }
    }
    catch (e) {
        console.log(e)
        return false
    }
}

// send in query the emailaddress
app.get('/sendOTP', async (req, res) => {
    try {
        const users = await getUsers(req.query.emailAddress)
        if (users.response) {
            let otp = Math.floor(100000 + Math.random() * 900000)
            await OTPs.doc(req.query.emailAddress).set({ emailAddress: req.query.emailAddress, otp: otp });
            await otpMail(req.query.emailAddress, 'Forgot Password', otp)
            res.send({ msg: true })
        } else {
            throw 'Invalid User !!!'
        }
    } catch (e) {
        console.log(e);
        res.send({ msg: false })
    }
})

// send in query the otp and emailaddress
app.get('/checkOTP', async (req, res) => {
    const snapshot = await OTPs.where('emailAddress', '==', req.query.emailAddress).get();
    if (snapshot.empty) {
        res.send({ msg: false })
    } else {
        if (snapshot.docs[0].data()['otp'] === parseInt(req.query.otp)) {
            res.send({ msg: true })
        } else
            res.send({ msg: false })
    }
})

// send in query the newpassword and emailaddress
app.post('/updatePassword', async (req, res) => {
    try {
        let data = req.body
        await User.doc(data['emailAddress']).update({ password: data.newpassword })
        res.send({ msg: true })
    } catch (e) {
        res.send({ msg: false, response: e })
    }
})

// api for updating close (uid, apikey)
// http://api.teamagentadvantage.com/close_lead_externally/ body: {apiKEY, leaduid}
app.post('/close_lead_externally', async (req, res) => {
    const data = req.body
    console.log(data);
    try {
        const apiKEY = await APIs.where('apiKEY', '==', data.apiKEY).get();
        if (apiKEY) {
            const snapshot = await Lead.where('uid', '==', data.leaduid).get();
            if (snapshot.empty) {
                res.send({ msg: false })
            } else {
                snapshot.docs.map(async (doc) => {
                    d = doc.data()
                    // close the lead
                    await Lead.doc(d.uid).update({ transaction: "CLOSED" })
                    // find the credits acc to loanAMT
                    let credits = (parseFloat(d.loanAmt) * process.env.CALCULATOR) / 100
                    // add credits to the account
                    await getUsers(d.emailAddress)
                        .then(async (val) => {
                            let finalcredits = parseFloat(val.data.credits) + parseFloat(credits)
                            await User.doc(d.emailAddress).update({ credits: finalcredits })
                        });
                    res.send({ msg: true })
                })
            }
        } else {
            throw "Invalid APIKEY !!!"
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false, response: e })
    }
})

app.get('/get_leads_externally', async (req, res) => {
    const data = req.query
    try {
        const apiKEY = await APIs.where('apiKEY', '==', data.apiKEY).get();
        if (apiKEY) {
            await fetchAllLeads(req, res)
        } else {
            throw "Invalid APIKEY !!!"
        }
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false, response: e })
    }
})

if (process.env.LIVE === 1)
    setInterval(async () => {
        await sendcreditMail()
    }, process.env.TIMETOSEND_CREDITMAIL)

module.exports = app
