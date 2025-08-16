const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors({
    origin: 'https://chatbotconia.netlify.app',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(bodyParser.json());


    app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "No se recibió ningún mensaje para procesar." });
    }

    try {
        const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-3.5-turbo",
            messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
            }))
        },
        {
            headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
            }
        }
        );

        const reply = response.data.choices?.[0]?.message?.content || "Sin respuesta";
        res.json({ reply });
    } catch (error) {
        console.error("Error al consultar OpenRouter:", error.response?.data || error.message);
        res.status(500).json({ error: "Error al obtener respuesta de la IA" });
    }
    });

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en puerto ${PORT}`);
    });