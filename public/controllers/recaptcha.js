// Setup a global captcha
const recaptchaVerifier = new firebase.auth.RecaptchaVerifier("2fa-captcha", {
  size: "invisible",
  callback: function (response) {
    console.log("Captcha Successfully Solved!");
  },
});
  