const express = require("express");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const multer = require("multer");
const upload = multer();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: "https://ara-quizzes.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post(
  "/upload",
  cors(corsOptions),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No se subió ningún archivo.");
    }

    try {
      const pdfData = await pdfParse(req.file.buffer);
      const text = pdfData.text;

      // Lógica para el resumen
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Summarize the following text:\n\n${text}`,
          },
        ],
        max_tokens: 150,
      });

      const summary = summaryResponse.choices[0].message.content;

      // Lógica para las preguntas
      const questionsResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Generate a three questions and answers from the following text:\n\n${text}`,
          },
        ],
        max_tokens: 300,
      });

      const questions = questionsResponse.choices[0].message.content;

      res.json({ summary, questions });
    } catch (error) {
      console.error("Error en el procesamiento:", error);
      res.status(500).json({ error: "Error al procesar el archivo." });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
