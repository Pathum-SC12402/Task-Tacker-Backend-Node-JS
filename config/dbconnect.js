const mongoose = require("mongoose");

const connectDb = async () =>{
    mongoose.connection.on("connected",() =>{
        console.log("Db connected");
    })
   await mongoose.connect(process.env.MONGO_URI);
}

module.exports = connectDb;