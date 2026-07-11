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

//    app.get("/products", async (req: Request, res: Response) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 8;

//     const skip = (page - 1) * limit;

//     const products = await productsCollection
//       .find()
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     const totalProducts = await productsCollection.countDocuments();
//     console.log(page);
    
//     res.send({
//       products,
//       totalProducts,
//       currentPage: page,
//       totalPages: Math.ceil(totalProducts / limit),
//     });
//   } catch (error) {
//     res.status(500).send({
//       message: "Failed to fetch products",
//       error,
//     });
//   }
// });



app.get("/products", async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;

    const search = req.query.search?.toString() || "";
    const category = req.query.category?.toString() || "";
    const sort = req.query.sort?.toString() || "";

    const skip = (page - 1) * limit;

    // Filter
    const query: any = {};

    // Search by title
    if (search) {
      query.title = {
        $regex: search,
        $options: "i",
      };
    }

    // Category
    if (category && category !== "All") {
      query.category = category;
    }

    // Sort
    let sortQuery: any = {};

    switch (sort) {
      case "price_asc":
        sortQuery = { price: 1 };
        break;

      case "price_desc":
        sortQuery = { price: -1 };
        break;

      case "rating":
        sortQuery = { rating: -1 };
        break;

      case "newest":
        sortQuery = { availableDate: -1 };
        break;

      case "title_asc":
        sortQuery = { title: 1 };
        break;

      case "title_desc":
        sortQuery = { title: -1 };
        break;

      default:
        sortQuery = {};
    }

    const products = await productsCollection
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalProducts = await productsCollection.countDocuments(query);

    res.send({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to fetch products",
    });
  }
});


    app.get("/products/:id", async (req: Request<{id: string}>, res: Response) => {
      const id = req.params?.id
      const query = {
        _id: new ObjectId(id)
      }

      const result = await productsCollection.findOne(query)
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