const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    hp: { type: Number, default: 100 }
});

module.exports = mongoose.model('User', userSchema);