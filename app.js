const express = require('express')
const cors = require('cors')
const { db } = require('./config')
const app = express()
const fs = require('fs')
const crypto = require("crypto");

require('dotenv').config()
// Multer
const multer = require('multer')
const upload = multer({ dest: 'images' })

const mailToAdmin = require('./mailSystem/mailAdmin')
const mailForgotPassword = require('./mailSystem/mailForgotPassword')
const mailToUser = require('./mailSystem/mailUser')
const signupMail = require('./mailSystem/signupMail')
const creditMail = require('./mailSystem/creditMail')

const User = db.collection('Users')
const Lead = db.collection('Leads')
const Receipt = db.collection('Receipts')
const Logs = db.collection('Logs')

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

// Match the code & update the database with new password
app.post('/update_password', async (req, res) => {
    const data = req.body
    // Fetching the user from db
    await getUsers(data['emailAddress']).then(async (val) => {
        if (val['response'] === true) {
            // Match the code
            if (data['code'] === val.code) {
                await User.doc(data['emailAddress']).update({ password: data.updatedpassword })
                loginSession(req, res, val['data'], 'Logging in...')
            } else
                loginSession(req, res, null, 'Something went wrong !!!')
        } else {
            loginSession(req, res, null, "User doesn't exists !!!")
        }
    })
})

// Send code to email & to the db
app.post('/sendCode', async (req, res) => {
    const data = req.body
    // Fetching the user from db
    await getUsers(data['emailAddress']).then(async (val) => {
        if (val['response'] === true) {
            // generate a 6 digit randCode
            let randCode = Math.floor(100000 + Math.random() * 900000)
            // Updating the code to the db
            await User.doc(data['emailAddress']).set({ code: randCode })
            // send the code to the emailAddresss
            mailForgotPassword(data['emailAddress'], "Here is your password reset code !!!", data)

            res.send({ msg: "Password Sent !!!" })
        } else {
            res.send({ msg: "Something went wrong!!!" })
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
                User.doc(data['emailAddress']).update({ credits: parseFloat(val.data.credits) + parseFloat(data.credits) })
                await Lead.doc(data.uid).set({ ...data, transaction: "OPEN" })
            });

        // Changed
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
        const imagePath = req.file.path
        // Save this data to a database properly
        await getUsers(data['emailAddress'])
            .then(async (val) => {
                // No need to update the credits here
                // User.doc(data['emailAddress']).update({ credits: parseFloat(val.data.credits) - parseFloat(data.inputRecAmt) })
                await Receipt.doc(data.uid).set({ ...data, imageFile: imagePath })
            });
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
        const readStream = fs.createReadStream(`images/${imageName}`)
        readStream.pipe(res)
    } catch (e) {
        console.log(e);
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

// app.get('/fetchLogs', async (req, res) => {
//     const data = req.query
//     try {
//         const snapshot = await Receipt.where('emailAddress', '==', data['emailAddress']).get();
//         if (snapshot.empty) {
//             res.send({ msg: false })
//         } else {
//             res.send({ msg: true, data: snapshot.docs.map(doc => doc.data()) })
//         }
//     }
//     catch (e) {
//         console.log(e)
//         res.send({ msg: false })
//     }
// })

// Admin Console or Loan Officer
// Fetch all leads
app.get('/fetchAllLeads', async (req, res) => {
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
        // Update the log
        // await Logs.doc(data.emailAddress).set({ msg: `Your lead: ` + data.uid + ` name: ` + data.leadMailAddress + ` has been deleted by us.` })
        res.send({ msg: true })
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
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
                    throw new Error;
            });
        // update the credit of receipt
        await Receipt.doc(data.uid).update({ inputRecAmt: data.inputRecAmt })
        // updating the logs
        // await Logs.doc(data.emailAddress).set({ msg: `Your credit is updated to: ` + credits + ` due to your recent uploaded receipt (` + data.uid + `).` })
        res.send({ msg: true })
    }
    catch (e) {
        console.log(e)
        res.send({ msg: false })
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
                    console.log(data);
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

// setTimeout(async () => {
//     await sendcreditMail()
// }, process.env.TIMETOSEND_CREDITMAIL)

module.exports = app