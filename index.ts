import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const uri = process.env.MONGO_URI as string;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect MongoDB
    await client.connect();

    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME);
    const productsCollection = db.collection("products");

    // Routes

    app.get("/", (req: Request, res: Response) => {
      res.send("🚀 Swift Shift Server is running...");
    });

    app.get("/products", async (req: Request, res: Response) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    app.get("/products/:id", async (req: Request, res: Response) => {
      const id = req.params?.id
      const query = {
        _id: new ObjectId(id)
      }

      const result = await productsCollection.findOne()
      res.send(result);
    });


    app.get("/products-featured", async (req: Request, res: Response) => {
      const result = await productsCollection.find().limit(4).toArray();
      res.send(result);
    });

    app.post("/packages", async (req: Request, res: Response) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);
      res.send(result);
    });

    // Ping database
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB Ping Successful");
  } catch (error) {
    console.error(error);
  }
}

run();

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});