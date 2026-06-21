const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chat = async (req, res) => {
    try {
        const { message, context } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured in the environment.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We will use gemini-1.5-flash as the fast and capable model for general chat
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = `You are an AI teaching assistant for the Craft Code e-learning platform. 
Your goal is to help students learn programming concepts. 
Context about the current page/course: ${context || 'None provided.'}
Answer the student's question clearly, concisely, and provide code examples if applicable.`;

        const result = await model.generateContent(`${systemPrompt}\n\nStudent: ${message}\nAssistant:`);
        const responseText = result.response.text();

        res.status(200).json({ success: true, response: responseText });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ success: false, message: 'Failed to communicate with AI model.', error: error.message });
    }
};
