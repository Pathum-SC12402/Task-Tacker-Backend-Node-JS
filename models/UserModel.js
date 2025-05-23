const { required } = require('joi');
const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name:{
        type:String,
        trim:true,
        minLength:[3,"Name must be at least 3 characters long"],
        maxLength:[20,"Name must be less than 20 characters long"]
    },

    email:{
       type:String,
       required:[true,'Email is required'],
       trim:true,
       unique:[true,"Email must be unique!"],
       minLength:[5,"Email must be at least 5 characters long"],
       lowercase:true,
    },
    password:{
        type:String,
        required:[true,"Password must be provided!"],
        trim:true,
        select:false
    },
    role:{
        type:String,
        required:true,
        default:"user",
    },
    verified:{
        type:Boolean, 
        default:false
    },
    verificationCode:{
        type:String,
        select:false
    },
    verificationCodeValidation:{
        type:String,
        select:false
    },
    forgotPasswordCode:{
        type:String,
        select:false
    },
    forgotPasswordCodeValidation:{
        type:Number,
        select:false
    },
    lastLogin:{
        type:Date,
    },
},{
    timestamps:true
})

module.exports = mongoose.model("User",UserSchema);