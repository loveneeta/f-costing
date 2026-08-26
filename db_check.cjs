const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // assuming we don't have this. We can't access DB directly from node without credentials. 
// wait, we can't easily query firestore directly from bash unless we use the REST API or have credentials.
