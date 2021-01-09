var mongoose= require("mongoose");

var commentSchema= mongoose.Schema({
    text:{
       type: String,
       required: true
    },
    noOfLikes:{
        type: Number,
        default: 0

    },

    time1:{
        type:String,
        default:new Date().toISOString().slice(0,10)
    },
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        role:String
    },
    likedby:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports =mongoose.model("Comment",commentSchema);