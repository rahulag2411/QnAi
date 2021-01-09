var mongoose= require("mongoose");

//SCHEMA setup
var discussionSchema= new mongoose.Schema({
    topic: {
        type: String,
        required: true},
    question: {
        type: String,
        required: true},
    course: {
        type: String
    },
    author:{
            id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
                },
            username:String,
            
        },
    time1:{
            type:String,
            default:new Date().toISOString().slice(0,10)
        },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    anonymouslyAsked:{
        type:Boolean,
        default:false
    }
});

//setupsvhema to a model
module.exports=mongoose.model("Discussion",discussionSchema);