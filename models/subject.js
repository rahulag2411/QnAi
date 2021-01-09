var mongoose = require('mongoose');

var subjectSchema = new mongoose.Schema({
      subName: {
          type: String,
          required: true
      },

      questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Discussion"
        }
]

      
});

module.exports=mongoose.model("Subject",subjectSchema);
