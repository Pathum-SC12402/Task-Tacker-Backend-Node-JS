const jwt = require('jsonwebtoken');

exports.identifier = (req, res, next) => {
    let token;
    if(req.headers.client === 'not-browser'){
        token = req.headers.authorization;
    }else{
        token = req.cookies['Authorization'];
    }

    if(!token){
        return res.status(403).json({message:"Unauthorized access"});
    }

    try{
        const userToken = token.split(' ')[1];
        
        const jwtVerified = jwt.verify(userToken,process.env.TOKEN_SECRET);
        console.log(jwtVerified);
        
        if(jwtVerified){
            req.user = jwtVerified;
            next();
        }else{
            throw new Error('Invalid token');
        }
    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Server Error"});
    }
};