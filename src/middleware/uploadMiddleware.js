import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/';
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
    destination: function (req,file,cb){
        cb(null,uploadDir);
    },
    filename: function (req,file,cb){
        const uniqueSuffix = Date.now() + '_' + file.originalname.replace(/\s/g,'_');
        cb(null,uniqueSuffix);
    }
});

const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'application/pdf' || file.mimetype === 'text/plain'){
        cb(null,true);
    }else{
        cb(new Error('only pdf and txt files are allowed'),false);
    }
};

const upload = multer({
    storage: storage,
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter: fileFilter
});

export default upload;