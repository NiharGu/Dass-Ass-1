const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        
        email:{
            type: String,
            required: true,
            unique: true
        },
        password:{
            type: String,
            required: true
        },
        role:{
            type: String,
            enum:["admin","organizer","participant"],
            required: true
        },

    // These are REQUIRED only if role === "participant"

    firstName: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    lastName: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    participantType: {
      type: String,
      enum: ["iiit", "non-iiit"],
      required: function () {
        return this.role === "participant";
      }
    },

    collegeOrOrgName: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    },

    contactNumber: {
      type: String,
      required: function () {
        return this.role === "participant";
      }
    }
  }
 
);

module.exports = mongoose.model("User",userSchema);