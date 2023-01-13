const firebase = require('firebase')

firebaseConfig = {
    apiKey: "AIzaSyDP-mziH1Jl8Ok3NmH9xHVDek3YZ9GXlH8",
    authDomain: "teamagentadvantage-c3e2d.firebaseapp.com",
    projectId: "teamagentadvantage-c3e2d",
    storageBucket: "teamagentadvantage-c3e2d.appspot.com",
    messagingSenderId: "396700019737",
    appId: "1:396700019737:web:7103e68d712c59710f8e88"
};

firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()
module.exports = {db};