import fs from 'fs';
import path from 'path';
import prisma from '../config/database.js';
import pdfParse from 'pdf-extraction';
import { generateSummaryAndTags } from '../utils/geminiHelper.js';

export const uploadFile = async (req,res)=>{
    try{

        if(!req.file){
            return res.status(400).json({message:'no file uploaded'});
        }

        const {filename,path: filePath, mimetype, originalname} = req.file;
        const userId = req.userId;

        const fileType = mimetype === 'application/pdf' ? 'pdf' : 'txt';

        let extractedText = '';
        const fileBuffer = fs.readFileSync(req.file.path);

        if (fileType === 'pdf') {
            const pdfData = await pdfParse(fileBuffer);
            extractedText = pdfData.text;
        } else if (fileType === 'txt') {
            extractedText = fileBuffer.toString('utf-8');
        }

        if(!extractedText || extractedText.trim().length < 10){
            fs.unlinkSync(filePath);
            return res.status(400).json({
                message: 'the pdf appears to be scanned or image-based. Please upload a text-based pdf'
            });
        }

        const newFile = await prisma.file.create({
            data: {
                userId: userId,
                fileName: originalname,
                filePath: filePath,
                fileType: fileType,
                extractedText: extractedText,
            }
        });


        let aiSummary = null;
        let topicTags = null;

        try{
            const aiResult = await generateSummaryAndTags(extractedText);
            aiSummary = aiResult.summary;

            topicTags = Array.isArray(aiResult.tags) ? aiResult.tags.join(', ') : 'General';
        
        }catch(aiError){
            console.log('AI Processing failed for file: ', newFile.id, aiError.message);
        }

        let updatedFile;
        if (aiSummary && topicTags){
            updatedFile = await prisma.file.update({
                where: {id: newFile.id},
                data: {
                    aiSummary: aiSummary,
                    topicTags: topicTags
                }
            });
        }else{
            updatedFile = newFile;
        }

        const { extractedText: _, ...fileWithoutText} = updatedFile;
        res.status(201).json({
            message: 'file uploaded and text extracted successfully',
            file: fileWithoutText
        });


    }catch(error){
        console.error('upload error: ', error);
        if(req.file && fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({message: 'internal server error', error: error.message});
    }
};

export const getTimeline = async (req,res) => {
    try{
        const userId = req.userId;
        
        const files = await prisma.file.findMany({
            where: {userId: userId},
            orderBy: {uploadedAt: 'desc'},
            select: {
                id:true,
                fileName: true,
                fileType: true,
                aiSummary: true,
                topicTags: true,
                uploadedAt: true,
            }
        });
        
        res.status(200).json(files);
    }catch(error){
        console.error('timeline error: ',error);
        res.status(500).json({message: 'internal server error'});
    }
};


export const deleteFile = async (req,res)=> {
    try{
        const {id} = req.params;
        const userId = req.userId;

        const file = await prisma.file.findFirst({
            where: {id: id,
                    userId: userId
            }
        });

        if(!file){
            return res.status(404).json({ message: 'File not found or unathorized' });
        }
        
        if(fs.existsSync(file.filePath)){
            fs.unlinkSync(file.filePath);
        }

        await prisma.file.delete({
            where: { id: id }
        });

        res.status(200).json({ message: 'File deleted successfully' });
    }catch(error){
        console.log('Delete Error: ', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
