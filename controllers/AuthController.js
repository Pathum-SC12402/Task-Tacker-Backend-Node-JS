const jwt = require('jsonwebtoken');
const User = require('../models/UserModel.js');
const {doHash,doHashValidation, hmacProcess} = require('../utilis/Hashing.js');
const {signupSchema,signinSchema, acceptCodeSchema, changePasswordSchema, acceptFPCodeSchema} = require('../middlewares/Validator.js');
const transport = require('../middlewares/SendMail.js');

exports.signup = async (req, res) => {
    const {name,email,password} = req.body;
    try{
        const {error,value} = await signupSchema.validate(req.body);

        if(error){
            return res.status(401).json({success:false,message:error.details[0].message});
        }
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(401).json({success:false,message:"User already exists"});
        }

        const hashedPassword = await doHash(password,12);
        const newUser = new User({
            name,
            email,
            password:hashedPassword
        });
        const result = await newUser.save();
        result.password = undefined;

        res.status(201).json({
            success:true,message:"Your account has been created successfully",data:result
        });       
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

exports.signin = async (req, res) => {
    const {email,password} = req.body;
    try{
        const {error,value} = await signinSchema.validate(req.body);
        if(error){
            return res.status(401).json({success:false,message:error.details[0].message});
        }

        const existingUser = await User.findOne({email}).select('+password');
        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }

        const isMatch = await doHashValidation(password,existingUser.password);
        if(!isMatch){
            return res.status(401).json({success:false,message:"Invalid credentials"});
        }

        const jwtSecret = process.env.TOKEN_SECRET || 'default_secret_key';
        console.log(jwtSecret);
        
        const token = jwt.sign(
        {
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified,
        },
        jwtSecret,
        { expiresIn: '1d' }
        );
        res.cookie('Authorization','Bearer '+token,{
            expires: new Date(Date.now() + 86400000),
            httpOnly:process.env.NODE_ENV === 'production',
            secure:process.env.NODE_ENV === 'production',
        })
        .json({
            success:true,
            message:"You have successfully logged in",
            token
        });
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

exports.signout = async (req, res) => {
    res.clearCookie('Authorization')
    .status(200)
    .json({success:true,message:"You have successfully logged out"});
}

exports.sendVerificationCode = async (req, res) => {
    const {email} = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }
        if(existingUser.verified){
            return res.status(401).json({success:false,message:"User is already verified"});
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification Code",
            html: '<h1>'+ verificationCode +'</h1>'
        });
        
        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(verificationCode,process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success:true,message:"Verification code has been sent to your email"});
        }
        return res.status(500).json({success:false,message:"Failed to send verification code"});
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

exports.verifyVerificationCode = async (req, res) => {
    const {email,providedCode} = req.body;
    try{
        const {error,value} = await acceptCodeSchema.validate(req.body);
        if(error){
            return res.status(401).json({success:false,message:error.details[0].message});
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email}).select('+verificationCode +verificationCodeValidation');

        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }
        if(existingUser.verified){
            return res.status(401).json({success:false,message:"User is already verified"});
        }
        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(401).json({success:false,message:"Something is wrong with the verification code"});
        }
        if(Date.now() - existingUser.verificationCodeValidation > 300000){
            return res.status(401).json({success:false,message:"Verification code has expired"});
        }
        const hashedCodeValue = hmacProcess(codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);
        if(hashedCodeValue === existingUser.verificationCode){
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({success:true,message:"User has been verified"});
        }
        return res
        .status(401)
        .json({success:false,message:"Unexpected error occured"});
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

exports.changePassword = async (req, res) => {
    const {userId,verified} = req.user;
    const {oldPassword,newPassword} = req.body;

    try{
        const {error,value} = await changePasswordSchema.validate(req.body);
        if(error){
            return res.status(401).json({success:false,message:error.details[0].message});
        }
        // if(!verified){
        //     return res.status(401).json({success:false,message:"User is not verified"});
        // }
        const existingUser = await User.findOne({_id:userId}).select('+password');
        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }
        const result = await doHashValidation(oldPassword,existingUser.password);
        if(!result){
            return res.status(401).json({success:false,message:"Invalid credentials"});
        }
        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({success:true,message:"Password has been changed successfully"});
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Server Error"});
    }
}

exports.sendForgotPasswordCode = async (req, res) => {
    const {email} = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification Code",
            html: '<h1>'+ verificationCode +'</h1>'
        });
        
        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(verificationCode,process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success:true,message:"Verification code has been sent to your email"});
        }
        return res.status(500).json({success:false,message:"Failed to send verification code"});
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}

exports.verifyForgotPasswordCode = async (req, res) => {
    const {email,providedCode,newPassword} = req.body;
    try{
        const {error,value} = await acceptFPCodeSchema.validate(req.body);
        if(error){
            return res.status(401).json({success:false,message:error.details[0].message});
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email}).select('+forgotPasswordCode +forgotPasswordCodeValidation');

        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }
        if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
            console.log(existingUser.forgotPasswordCode);
            return res.status(401).json({success:false,message:"Something is wrong with the verification code"});
        }
        if(Date.now() - existingUser.forgotPasswordCodeValidation > 300000){
            return res.status(401).json({success:false,message:"Verification code has expired"});
        }
        const hashedCodeValue = hmacProcess(codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);
        if(hashedCodeValue === existingUser.forgotPasswordCode){
            const hashedPassword = await doHash(newPassword,12);
            existingUser.password=hashedPassword;
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({success:true,message:"User has been verified"});
        }
        return res
        .status(401)
        .json({success:false,message:"Unexpected error occured"});
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}