const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

// 1. Move dotenv config here so env vars load before anything uses them
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// 2. Initialize MongoClient with process.env.MONGO_URI
const client = new MongoClient(process.env.MONGO_URI);
async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const proposalCollection = db.collection("proposals");

    // getProposalById
    app.get("/api/proposals/single/:id", async (req, res) => {
      try {
        const proposalId = req.params.id;

        const proposal = await proposalCollection.findOne({
          _id: new ObjectId(proposalId),
        });

        console.log("REQUESTED ID:", proposalId);
        console.log("MONGODB ID:", proposal?._id);
        console.log(
          "MONGODB additionalServices:",
          JSON.stringify(proposal?.additionalServices, null, 2),
        );

        if (!proposal) {
          return res.status(404).json({
            error: "Proposal not found.",
          });
        }

        res.status(200).json(proposal);
      } catch (error) {
        console.error("Error fetching proposal:", error);

        res.status(500).json({
          error: "An error occurred while fetching the proposal.",
        });
      }
    });

    // getProposals
    app.get("/api/proposals/get", async (req, res) => {
      try {
        const proposals = await proposalCollection.find({}).toArray();
        res.status(200).json(proposals);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        res
          .status(500)
          .json({ error: "An error occurred while fetching proposals." });
      }
    });

    // post proposal
    app.post("/api/proposals", async (req, res) => {
      try {
        const proposal = req.body;
        const result = await proposalCollection.insertOne(proposal);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error inserting proposal:", error);
        res
          .status(500)
          .json({ error: "An error occurred while inserting the proposal." });
      }
    });

    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
run();
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
