import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite'
});

export const generateSummaryAndTags = async(text)=> {
    try{
        const truncatedText = text.slice(0, 30000);
        const prompt = `
            You are an academic AI assistant.
            Analayze the following text extracted from a strudent's PDF document.

            Your tasks: 
            1. Write a very concise, one-sentence summary of the main topic (max 20 words).
            2. Extract exactly 3 broad academic topic keywords (e.g., "Data Structures", "Machine Learning", "Organic Chemistry").

            IMPORTANT: Return your response STRICTLY as a single JSON object with exactly these two keys:
            - "summary" (string)
            - "tags" (array of 3 string)

            DO NOT include any other text, markdown formatting, or code blocks. Just the raw JSON.

            Text to analyze:
            """${truncatedText}"""
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g,'').trim();

        const parsed = JSON.parse(cleanJson);

        if(!Array.isArray(parsed.tags)){
            parsed.tags = parsed.tags ? [parsed.tags] : ['General'];
        }

        if(!parsed.summary){
            parsed.summary = 'Study material uploaded.';
        }

        return parsed;
    }catch(error){
        console.error('Gemini Summary/Tag Error:', error.message);
        return{
            summary: 'AI summary generation failed. Please try re-uploading',
            tags: ['General']
        };
    }
};

export const askQuestion = async (context,question)=> {
    try{
        const truncatedContext = context.slice(0,50000);
        const prompt = `
            You are a strict study assistant.
            You MUST answer the user's question using ONLY the provided "Context" below (which comes from their uploaded notes).
            If the answer is not explicitly found in the context, strictly reply: "I cannot find this in your uploaded materials. Please upload relevant files."

            Context:
            """${truncatedContext}"""

            User Question: ${question}

            Answer (based ONLY on the context):
        `;

        const result = await model.generateContent(prompt);
        return result.response.text(); 
    
    }catch(error){
        console.error('Gemini QA Error:', error.message);
        return 'AI service is currently unavailable. Please try again later.';
    }
};