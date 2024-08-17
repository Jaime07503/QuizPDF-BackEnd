const express = require("express");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

async function summarizeText(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: `Summarize the following text:\n\n${text}` },
    ],
    max_tokens: 100,
  });
  return response.choices[0].message;
}

async function generateQuestionsAndAnswers(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `Generate a three questions and answers from the following text:\n\n${text}`,
      },
    ],
    max_tokens: 300,
  });
  return response.choices[0].message;
}

async function cleanText(text) {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/upload", async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  try {
    const filePath = path.join(__dirname, req.file.path);
    const dataBuffer = fs.readFileSync(filePath);

    const data = await pdfParse(dataBuffer);
    const extractedText = data.text;
    const cleanExtractedText = await cleanText(extractedText);

    const summary = await summarizeText(cleanExtractedText);
    const questions = await generateQuestionsAndAnswers(cleanExtractedText);

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
