import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const register = async(req,res)=>{
    try{
        const{name,email,password} = req.body;

        const existingUser = await prisma.user.findUnique({
            where: {email}
        });

        if(existingUser){
            return res.status(400).json({message: 'user already exists'});
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const user = await prisma.user.create({
            data:{
                name,
                email,
                password: hashedPassword
            }
        });

        const token = jwt.sign(
            {id: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        res.cookie('token',token,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7*24*60*60*1000
        });

        const { password: _, ...userWithoutPassword} = user;
        res.status(201).json({
            message: 'user registered successfully',
            user: userWithoutPassword
        });

    }catch(err){
        console.error('Register error:', err);
        res.status(500).json({message: 'internal server error'});
    }
};
    export const login = async(req,res)=>{
        try{
            const {email,password}=req.body;

            const user = await prisma.user.findUnique({
                where: {email}
            });

            if(!user){
                return res.status(401).json({message: 'invalid credentials'});
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(!isPasswordValid){
                return res.status(401).json({message: 'invalid credentials'});
            }

            const token = jwt.sign(
                {id: user.id, email: user.email},
                process.env.JWT_SECRET,
                {expiresIn: '7d'}
            );

            res.cookie('token',token,{
                httpOnly:true,
                secure:false,
                sameSite:'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const {password: _, ...userWithoutPassword}= user;
            res.status(200).json({
                message: 'login successfull',
                user: userWithoutPassword
            });

        }catch(err){
            console.error('login error',err);
            res.status(500).json({message: 'internal server error'});
        }
    };

    export const logout = async(req,res)=>{
        res.clearCookie('token');
        res.status(200).json({message:'logged out successfully'});
    };

    export const getMe = async (req,res)=>{
        try{
            const user = await prisma.user.findUnique({
                where: {id: req.userId}
            });
            if(!user){
                return res.status(404).json({message: 'user not found'});
            }
            const {password, ...userWithoutPassword} = user;
            res.status(200).json(userWithoutPassword);
        }catch(err){
            res.status(500).json({message: 'server error'});
        }
    };

