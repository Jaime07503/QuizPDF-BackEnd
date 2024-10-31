const express = require("express");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  try {
    const filePath = path.join(__dirname, req.file.path);
    const dataBuffer = fs.readFileSync(filePath);

    // Extraer el texto del PDF
    const data = await pdfParse(dataBuffer);
    const extractedText = data.text;

    // Limpiar el texto (función integrada)
    const cleanExtractedText = extractedText
      .replace(/[\r\n]+/g, " ")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Generar resumen
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Summarize the following text:\n\n${cleanExtractedText}`,
        },
      ],
      max_tokens: 100,
    });
    const summary = summaryResponse.choices[0].message.content;

    // Generar preguntas y respuestas
    const questionsResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Generate three questions and answers from the following text:\n\n${cleanExtractedText}`,
        },
      ],
      max_tokens: 300,
    });
    const questions = questionsResponse.choices[0].message.content;

    // Borrar el archivo después de procesarlo
    fs.unlinkSync(filePath);

    res.json({
      summary,
      questions,
    });
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    res.status(500).send("Error al procesar el archivo.");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;
