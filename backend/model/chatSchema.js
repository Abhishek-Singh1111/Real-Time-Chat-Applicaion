const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema({

   sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
   },

   receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
   },
   image_url:{
       type:String

   },
   message: {
      type: String,
      required: false,
      default: null
   },
   
}, {
   timestamps: true
},
);
module.exports = mongoose.model("Chat", chatSchema);
