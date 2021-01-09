var mongoose=    require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
const discussion = require("./discussion");

var UserSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },

   

    enrollmentNo:{
        type: Number,
        //required: true
    },

    branch:{
        type: String,
        //required: true
    },

    questionsaskedbyme:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Discussion"
        }
    ],

    questionbookmarkedbyme:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Discussion"
        },
    ],
   
    totalAnswered:{
        type: Number,
        default:0
    },

    totalAsked:{
        type: Number,
        default:0
    }
});

UserSchema.plugin(passportLocalMongoose);
module.exports =mongoose.model("User",UserSchema);