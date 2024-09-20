// Import the required modules
const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS pour autoriser uniquement https://test-api-eight-neon.vercel.app
const corsOptions = {
  origin: ['*', 'https://test-api-eight-neon.vercel.app/', 'test-api-eight-neon.vercel.app', 'https://test-api-eight-neon.vercel.app'],
  optionsSuccessStatus: 200 // Pour les anciens navigateurs qui ne supportent pas 204
};


// Appliquer les options CORS à toutes les routes
app.use(cors(corsOptions));

// MD convert to html
const showdown = require("showdown");
const converter = new showdown.Converter();

const openai = new OpenAI({
  apiKey: process.env.api_key,
});
app.get("/", (req, res) => {
  res.json({ message: "Test api" });
});
app.post("/test-api", async (req, res) => {
  try {
    const { message, latitude, longitude } = req.body;

    console.log(latitude + " - " + longitude);

    const apiUrl = "https://api.ignitia.cloud/api/basic/v1/forecast/common"; // Remplace par l'URL de ton API

    // Données envoyées par le client
    const postData = {
      latitude: latitude,
      longitude: longitude,
      date: "2024-09-20",
      date_interval: {
        end: "2024-09-24",
        start: "2024-09-18",
      },
    };

    // Clé API
    const apiKey = "db3636f6-d440-42d9-b486-14d35940919a"; // Remplace par ta clé API réelle

    // Requête à l'API externe avec Axios
    const response = await axios.post(apiUrl, postData, {
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey, // Ajout de la clé API dans les en-têtes
      },
    });

    // Retourner la réponse de l'API au client
    const data = response.data;

    // Extraire la première clé dynamiquement
    const firstKey = Object.keys(data)[0];

    // Accéder aux données "daily" sans utiliser explicitement la date
    const dailyData = data[firstKey].daily;
    const m = message + " " + dailyData;

    const response_openai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Hello, you're a helpfull assistante" },
        { role: "user", content: m },
      ],
      temperature: 0,
      max_tokens: 1000,
    });

    // Accéder au contenu du message
    const content = response_openai.choices[0].message.content;
    const htmlContent = converter.makeHtml(content);
    res.status(200).json(htmlContent);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Start the server on port 3000
app.listen(5001, () => {
  console.log("Server is running on port 3000");
});
