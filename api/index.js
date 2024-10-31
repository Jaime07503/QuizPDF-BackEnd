const express = require("express");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/upload", async (req, res) => {
  if (!req.body || !req.body.fileBuffer) {
    return res.status(400).send("No file data provided.");
  }

  try {
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(req.body.fileBuffer, "base64");

    // Extract text from PDF
    const data = await pdfParse(fileBuffer);
    const extractedText = data.text;

    // Clean the text
    const cleanExtractedText = extractedText
      .replace(/[\r\n]+/g, " ")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Generate summary
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

    // Generate questions and answers
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

    res.json({
      summary,
      questions,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file.");
  }
});

module.exports = app;
