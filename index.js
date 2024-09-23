// Import the required modules
const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const showdown = require("showdown");
const OpenAI = require("openai");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// MD convert to html
const converter = new showdown.Converter();

const openai = new OpenAI({
    apiKey: process.env.api_key,
});

app.get("/", (req, res) => {
    res.json({ message: "Test api v1." });
});

app.post("/get_data_api", async (req, res) => {
    try {
        const { message, latitude, longitude, product, language, techniques } =
            req.body;

        if (message && latitude && longitude && product && language) {
            const apiUrl =
                "https://api.ignitia.cloud/api/basic/v1/forecast/common"; // Remplace par l'URL de ton API

            // Données envoyées par le client
            const today = new Date(); // Date d'aujourd'hui

            // Calculer la date de début et de fin de l'intervalle de 7 jours
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 3); // 3 jours avant aujourd'hui

            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 3); // 3 jours après aujourd'hui

            const postData = {
                latitude: latitude,
                longitude: longitude,
                date: today.toISOString().split("T")[0], // Format YYYY-MM-DD
                date_interval: {
                    start: startDate.toISOString().split("T")[0],
                    end: endDate.toISOString().split("T")[0],
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
            const dd = JSON.stringify(dailyData);
            let m = message + " " + dd + "  " + language;

            if (techniques) {
                m = `${message} ${dd} et itinéraires techniques agricoles pour cette culture : ${techniques}. donner le resultat en ${language}.`;
            }
            console.log(m);

            const response_openai = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Hello, you're a helpfull assistante",
                    },
                    { role: "user", content: m },
                ],
                temperature: 0,
                max_tokens: 1000,
            });

            // Accéder au contenu du message
            const content = response_openai.choices[0].message.content;
            const htmlContent = converter.makeHtml(content);
            res.status(200).json(htmlContent);
        } else {
            res.status(200).json({
                message: "Veuillez remplir tous les champs.",
            });
        }
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// Start the server on port 3000
app.listen(5001, () => {
    console.log("Server is running http://localhost:5001 on port 5001");
});
