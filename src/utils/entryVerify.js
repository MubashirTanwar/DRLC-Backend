// Function to check the validity of an email ID
function isValidEmail(email) {
    const emailRegex = /@mhssce\.ac\.in$/;
    return emailRegex.test(email);
  }
  
// Function to check the password format
function isValidPassword(password) {
    const nameRegex = /[a-zA-Z]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const numberRegex = /\d/;
  
    return nameRegex.test(password) && specialCharRegex.test(password) && numberRegex.test(password);
  }

// PRN as a string
function isValidPRN(prn) {
    const prnRegex = /\d{6,}/;
    return prnRegex.test(prn);
  }
  