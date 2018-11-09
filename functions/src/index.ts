const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
admin.firestore().settings({ timestampsInSnapshots: true });
let db = admin.firestore();
let user = functions.auth.user();

const nodemailer = require('nodemailer');
const mailTransport = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: functions.config().namecheap.email,
        pass: functions.config().namecheap.password,
    }
})


exports.newUserSetup = functions.auth.user().onCreate((user) => {
    let promises = [];

    promises.push(db.doc(`users/${user.uid}`).set({
        preferences: {
            newsLetter: true,
        },
    }, { merge: true })); // init user prefs

    promises.push(sendEmail(user.email, 'Welcome from JamiBot',
        `
            <p>Hi,</p>
            <p>Thanks for signing up,</p>
            <p>Jami Bot</p>
        `));
    
    return Promise.all(promises);
});



function emptyPromise(val = null) {
    return new Promise((resolve) => { resolve(val); });
}

function sendEmail(targetEmail, subject, html) {
    let mailOptions = {
        from: '"JamiBot" <contact@mycompany.com>',
        to: targetEmail,
        subject,
        html: `
        <div style="font: 500 20px/32px Arial, Helvetica, sans-serif; padding: 32px">
            <h1>
                Namecheap & Firebase
            </h1>
            ${html}
        </div>
`
    };
    return retrySendMail(mailOptions, 5);
}

function retrySendMail(mailOptions, retriesLeft) {
    if (retriesLeft <= 0)
        return emptyPromise();

    return mailTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return retrySendMail(mailOptions, retriesLeft-1);
        }
        else {
            console.log('Message sent: %s', info.messageId);
            return emptyPromise();
        }
    });
}