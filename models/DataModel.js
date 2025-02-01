const { required } = require('joi');
const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    userId: {
       type: String,
       required: [true, 'userId is required'],
       trim: true,
    },
    date: {
        type: Date,
        required: [true, "date must be provided!"],
        trim: true,
    },
    title: {
        type: String,
        required: [true, "title is required"],
        trim: true,
    },
    subtasks: [{
        title: { type: String, required: true },
        completed: { type: Boolean, default: false }
    }],
    verificationCode: {
        type: String,
        select: false
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("Task", TaskSchema);
