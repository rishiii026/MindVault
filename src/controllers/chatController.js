import prisma from '../config/database.js';
import { askQuestion } from '../utils/geminiHelper.js';

export const chatQuery = async(req,res)=>{
    try{
        const { query } = req.body;
        const userId = req.userId;

        if(!query || query.trim().length === 0){
            return res.status(400).json({message: 'Please ask question'});
        }

        const recentFiles = await prisma.file.findMany({
            where: { userId: userId },
            orderBy: { uploadedAt: 'desc' },
            take: 3,
            select: {
                fileName: true,
                extractedText: true
            }
        });

        if(recentFiles.length === 0){
            return res.status(400).json({
                message: 'You have not uploaded any files yet. Please upload study materials first.'
            });
        }

        let context = '';
        recentFiles.forEach((file) => {
            context += `---File: ${file.fileName} ---\n`;
            context += file.extractedText ? file.extractedText : '[File content could not be extracted]';
            context += '\n\n';
        });

        const answer = await askQuestion(context, query);

        const sources = recentFiles.map(f => f.fileName);

        res.status(200).json({
            answer: answer,
            sources: sources
        });
    }catch(error){
        console.error('Chat Query Error: ', error);
        res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};