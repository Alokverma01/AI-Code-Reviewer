const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const MainRouter = require("./routes");

const app = express();

const ai = new GoogleGenAI({
  apiKey: "AIzaSyClip0wzqF7nHza6KhNOKxeh8R6Tkj9G1U",
});

app.use(express.json());
app.use("/api/v1", MainRouter);

app.get("/response", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({
      status: false,
      message: "input is required",
    });
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
    });
    return res.send({
      message: "Api is working",
      aiRespnse: response.text,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).send("Ai request failed");
  }
});

module.exports = app;
