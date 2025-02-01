const Joi = require('joi');

const signupSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({
        tlds:{allow:['com','net']}
    }),
    password: Joi.string().min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
});

const signinSchema = Joi.object({
    email: Joi.string().min(6).max(60).required().email({
        tlds:{allow:['com','net']}
    }),
    password: Joi.string().min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
});

const acceptCodeSchema = Joi.object({
    email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']}
    }),
    providedCode: Joi.number().required(),
});

const changePasswordSchema = Joi.object({
    newPassword: Joi.string().min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    oldPassword: Joi.string().min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
});

const acceptFPCodeSchema = Joi.object({
    email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']}
    }),
    providedCode: Joi.number().required(),

    newPassword: Joi.string().min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
});

module.exports = { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, acceptFPCodeSchema };