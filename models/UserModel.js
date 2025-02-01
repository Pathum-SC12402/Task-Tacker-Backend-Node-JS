const { required } = require('joi');
const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
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
    }
},{
    timestamps:true
})

module.exports = mongoose.model("User",UserSchema);