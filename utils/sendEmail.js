// ==========================================================
// EMAIL BHEJNA (Brevo)
//
// Gmail + Nodemailer yahan kaam nahi karta: Render ka free
// plan SMTP ports (25, 465, 587) block karta hai. Brevo ek
// normal HTTPS request se email bhejta hai (port 443), jo
// block nahi hota. Node 18+ me fetch pehle se hota hai, isliye
// koi naya npm package nahi chahiye.
//
// .env me chahiye:
//   BREVO_API_KEY = Brevo -> SMTP & API -> API Keys
//   EMAIL_FROM    = Brevo me verify kiya hua sender email
//
// Agar BREVO_API_KEY nahi hai (jaise laptop pe testing), to
// email bhejne ke bajaye terminal me print kar dete hain -
// taaki bina Brevo account ke bhi signup test ho sake.
// ==========================================================

const sendEmail = async ({ to, subject, text, html }) => {

    if (!process.env.BREVO_API_KEY) {

        console.log("--------------------------------------------------");
        console.log("BREVO_API_KEY missing - email NOT sent. It would have said:");
        console.log("To:      " + to);
        console.log("Subject: " + subject);
        console.log(text);
        console.log("--------------------------------------------------");

        return;
    }


    const response = await fetch("https://api.brevo.com/v3/smtp/email", {

        method: "POST",

        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },

        body: JSON.stringify({
            sender: {
                name: "CampusShare",
                email: process.env.EMAIL_FROM
            },
            to: [{ email: to }],
            subject: subject,
            textContent: text,
            htmlContent: html
        })
    });


    // Brevo success pe 201 deta hai. Kuch aur aaya to asli
    // wajah (jaise "sender not verified") error me daal do,
    // taaki Render logs me dikhe.
    if (!response.ok) {

        const details = await response.text();

        throw new Error(
            "Brevo could not send the email (" + response.status + "): " + details
        );
    }
};

module.exports = sendEmail;
