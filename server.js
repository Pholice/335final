const express = require("express");
const path = require("path");
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = 5001;

const databaseName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;
const uri = process.env.MONGO_CONNECTION_STRING;
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1 }
});
let adviceCollection; 
let session;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.get("/", (request, response) => {
    response.render("index");
});

app.post("/main", (request, response) => {
    const user = request.body.ID
    const payload = {
        ID: user,
    }
    session = user;
    response.render("main", payload);
});

app.get("/main", (request, response) => {
    const payload = {
        ID: session,
    }
    response.render("main", payload);
});

app.get("/saved", async (request, response) => {
    try {
        const cursor = adviceCollection.find({ user: session });
        const allAdviceObjects = await cursor.toArray();
        const adviceHtmlArray = allAdviceObjects.map(item => {
            if (item && typeof item.advice === 'string') {
                const escapedAdvice = item.advice;
                return escapedAdvice + "<br>";
            }
            return ""; 
        });
        const combinedHtmlString = adviceHtmlArray.join("\n");
        const dataForTemplate = {
            adviceListHtml: combinedHtmlString 
        };

        response.render("saved", dataForTemplate);
    } catch (e) {
        console.error(e);
    }
});

app.post('/api/save-advice', async (req, res) => {
    const adviceText = req.body.advice;

    if (!adviceText || typeof adviceText !== 'string' || adviceText.trim() === "") {
        return res.status(400).json({ success: false, message: "No valid advice text provided." });
    }

    if (!adviceCollection) {
         console.error("Save attempt failed: Database collection not available.");
         return res.status(500).json({ success: false, message: "Database service is unavailable." });
    }

    try {
        const adviceDocument = {
            user: session.trim(),
            advice: adviceText.trim(), 
        };

        const result = await adviceCollection.insertOne(adviceDocument);
        if (result.insertedId) {
            console.log(`Advice saved successfully with ID: ${result.insertedId}`);
            res.status(201).json({ success: true, insertedId: result.insertedId });
        } else {
            console.error("Insertion failed, but no error was thrown.");
            throw new Error("Failed to insert document into database.");
        }
    } catch (e) {
        console.error("Error inserting advice into MongoDB:", e);
        res.status(500).json({ success: false, message: "Failed to save advice due to a server error." });
    }
});



async function main() {
    try {
        await client.connect();
        console.log("Successfully connected to MongoDB.");
        adviceCollection = client.db(databaseName).collection(collectionName);

        app.listen(port, () => {
            console.log(`Webserver started and running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB or start server", err);
        process.exit(1);
    }
}

main(); 