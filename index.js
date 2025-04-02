const express = require('express');
const { default: helmet } = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const connectDb = require("./config/dbconnect.js");

const authRouter = require('./routers/authRouter.js');
const postsRouter = require('./routers/postsRouter.js');
const dataRouter = require('./routers/dataRouter.js');

const app = express()
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
connectDb();

app.use('/api/auth',authRouter);
app.use('/api/posts',postsRouter);
app.use('/api/data',dataRouter)

app.get('/',(req,res)=>{
    res.json({message:"Hello from the server"});
})
// const port = process.env.PORT 
// console.log("Loaded PORT:", port);

// app.listen(port,()=>{
//     console.log(`Server running on http://localhost:${port}`);
// })

module.exports = app; // Export the app for testing purposes