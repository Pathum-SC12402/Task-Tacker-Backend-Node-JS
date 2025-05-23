const jwt = require('jsonwebtoken');
const User = require('../models/UserModel.js');
const {doHash,doHashValidation, hmacProcess} = require('../utilis/Hashing.js');
const {signupSchema,signinSchema, acceptCodeSchema, changePasswordSchema, acceptFPCodeSchema} = require('../middlewares/Validator.js');
const transport = require('../middlewares/SendMail.js');
const PendingVerification = require('../models/PendingVerification.js');

exports.verifyCodeAndSignup = async (req, res) => {
    const { email, code } = req.body;
    console.log(email, code);
    try {
        const userVerification = await PendingVerification.findOne({ email });
        console.log(userVerification);

        if (!userVerification) {
            return res.status(400).json({ success: false, message: "No verification request found" });
        }

        const hashedInputCode = hmacProcess(code, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedInputCode !== userVerification.code) {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }

        console.log('User password:', userVerification.password); // Debugging line
        const hashedPassword = await doHash(userVerification.password, 12);

        const newUser = new User({
            name: userVerification.name,
            email: userVerification.email,
            password: hashedPassword,
            role:'user',
        });

        await newUser.save();

        await PendingVerification.deleteOne({ email });

        return res.status(201).json({ success: true, message: "Account created successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.sendVerificationCodeForNewUser = async (req, res) => {
    const { email, name, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = hmacProcess(verificationCode, process.env.HMAC_VERIFICATION_CODE_SECRET);

        await PendingVerification.updateOne(
            { email },
            {
                name,
                password,
                code: hashedCode,
                createdAt: Date.now()
            },
            { upsert: true }
        );

        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: "Email Verification Code",
            html: `<h2>${verificationCode}</h2>`
        });

        return res.status(200).json({ success: true, message: "Verification code sent to email" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to send code." });
    }
};

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

        existingUser.lastLogin = new Date();
        await existingUser.save();

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
    console.log(email);
    try{
        const existingUser = await User.findOne({email});
        console.log(existingUser);
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
        const existingUser = await User.findOne({email}).select('+verificationCode +verificationCodeValidation');

        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }
        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(401).json({success:false,message:"Something is wrong with the verification code"});
        }
        if(Date.now() - existingUser.verificationCodeValidation > 300000){
            return res.status(401).json({success:false,message:"Verification code has expired"});
        }
        const hashedCodeValue = hmacProcess(providedCode,process.env.HMAC_VERIFICATION_CODE_SECRET);
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
    const {userId} = req.user;
    const {oldPassword,newPassword} = req.body;

    try{
        const {error,value} = await changePasswordSchema.validate(req.body);
        if(error){
            return res.status(401).json({success:false,message:error.details[0].message});
        }
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

// exports.sendForgotPasswordCode = async (req, res) => {
//     const {email} = req.body;
//     try{
//         const existingUser = await User.findOne({email});
//         if(!existingUser){
//             return res.status(401).json({success:false,message:"User does not exist"});
//         }

//         const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//         let info = await transport.sendMail({
//             from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
//             to: existingUser.email,
//             subject: "Verification Code",
//             html: '<h1>'+ verificationCode +'</h1>'
//         });
        
//         if(info.accepted[0] === existingUser.email){
//             const hashedCodeValue = hmacProcess(verificationCode,process.env.HMAC_VERIFICATION_CODE_SECRET);
//             existingUser.forgotPasswordCode = hashedCodeValue;
//             existingUser.forgotPasswordCodeValidation = Date.now();
//             await existingUser.save();
//             return res.status(200).json({success:true,message:"Verification code has been sent to your email"});
//         }
//         return res.status(500).json({success:false,message:"Failed to send verification code"});
//     }catch(err){
//         console.log(err);
//         res.status(500).json({message:"Server Error"});
//     }
// }

exports.changeForgotPasswordCode = async (req, res) => {
    const {email,newPassword} = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(401).json({success:false,message:"User does not exist"});
        }
        const password = await doHash(newPassword,12);
        existingUser.password = password;
        existingUser.forgotPasswordCode = undefined;
        existingUser.forgotPasswordCodeValidation = undefined;
        await existingUser.save();
        return res.status(200).json({success:true,message:"Password has been changed successfully"});
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server Error"});
    }
}