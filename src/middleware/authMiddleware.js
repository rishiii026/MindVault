import jwt from 'jsonwebtoken';

export const protect = (req,res,next) => {
    try{
        const token = req.cookies.token;
        
        if(!token){
            return res.status(401).json({message:'not authorised, no token'});
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
        req.userId = decoded.id;
        req.userEmail = decoded.email;

        next();


    }catch(err){
        console.error('Auth Middleware Error: ',err);
        res.status(401).json(({message:'not authorised, token failed'}));
    }
};