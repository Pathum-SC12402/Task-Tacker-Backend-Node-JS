const mongoose = require('mongoose');

const PendingVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String},
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Ensure TTL Index is Created
PendingVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model("PendingVerification", PendingVerificationSchema);
