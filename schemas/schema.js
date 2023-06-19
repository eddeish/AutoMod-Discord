const { model, Schema } = require("mongoose");

let spamDetection = new Schema({
    guildId: String,
    permCh: String,
    permRole: String,
    alertChannel: String,
    maxDuplicate: String,
});

module.exports = model("spam", spamDetection);