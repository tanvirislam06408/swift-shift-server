import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string, unknown>;
    }
  }
}


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


const JWKS = createRemoteJWKSet(new URL(`${process.env.NEXT_CLIENT_SITE}/api/auth/jwks`))

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).send({ message: 'unauthorize' })
  }
  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).send({ message: 'unauthorize' })
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload
    next()

  }
  catch (err) {

    res.status(401).send({ message: 'unauthorize' })
  }



}


// verify admin
const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {


  if (req?.user?.role !== 'admin') {
    return res.status(403).send({ message: 'Forbidden' })
  }

  next();
}


async function run() {
  try {
    // Connect MongoDB
    // await client.connect();

    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME);
    const productsCollection = db.collection("products");
    const cartCollection = db.collection("cart");
    const ordersCollection = db.collection("orders");
    const userColl = db.collection("user");

    // Routes

    app.get("/", (req: Request, res: Response) => {
      res.send("🚀 Swift Shift Server is running...");
    });




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


    app.get("/products/:id", async (req: Request<{ id: string }>, res: Response) => {
      const id = req.params?.id
      const query = {
        _id: new ObjectId(id)
      }

      const result = await productsCollection.findOne(query)
      res.send(result);
    });



    // get product by category
    app.get('/product/:category', async (req: Request<{ category: string }>, res: Response) => {
      const category = req.params.category;
      const query: any = {};


      if (category && category !== "All") {
        query.category = category;
      }
      console.log(category);

      try {
        const products = await productsCollection.find(query).toArray();

        console.log(products);

        res.send(products);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch products by category' });
      }
    })


    // product add to cart
    app.post('/add-to-cart',verifyToken, async (req: Request, res: Response) => {
      const data = req.body;
      const isExist = {
        userId: data.userId,
        productId: data.productId
      }
      console.log(isExist);
      const exist = await cartCollection.findOne(isExist);

      if (exist) {
        return res.status(409).send({
          success: false,
          message: "Product already exists in cart",
          isExist: true,
        });
      }


      const result = await cartCollection.insertOne(data);
      console.log(result);

      res.send(result)

    })

    // get cartData 
    app.get('/api/cartData/:userId',verifyToken, async (req: Request, res: Response) => {
      const userId = req.params.userId
      const query = {
        userId: userId
      }
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })


    // orders and delete from cart
    app.post('/api/orders', async (req: Request, res: Response) => {

      const data = req.body

      const user = data.customerDetails.userId
      console.log(user);


      const query = {
        userId: user
      }
      const deleteFormCart = await cartCollection.deleteMany(query);
      console.log(query);

      const result = await ordersCollection.insertOne(data);
      res.send(result);



    })

    app.delete('/cart/delete', async (req: Request, res: Response) => {
      const { id } = req.body as { id: string };
      const query = {
        _id: new ObjectId(id)
      }

      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    // add product
    app.post('/add-products',verifyToken,verifyAdmin, async (req: Request, res: Response) => {
      const data = req.body
      const result = await productsCollection.insertOne(data);
      res.send(result)

    })



    // delete product
    app.delete('/delete-products/:id',verifyToken,verifyAdmin, async (req: Request, res: Response) => {
      const { id } = req.params as { id: string };
      const query = {
        _id: new ObjectId(id)
      }

      const result = await productsCollection.deleteOne(query)
      res.send(result);

    })



    //  getallUsers

    app.get('/get-users',verifyToken,verifyAdmin, async (req: Request, res: Response) => {
      const result = await userColl.find().toArray();
      res.send(result);

    })


    // user dashboard infos


    app.get(
      "/get-user-data/:userId", verifyToken,
      async (req: Request<{ userId: string }>, res: Response) => {
        try {
          const { userId } = req.params;

          const orders = await ordersCollection
            .find({
              "customerDetails.userId": userId,
            })
            .toArray();

          const cartItems = await cartCollection
            .find({ userId })
            .toArray();

          const totalSpent = orders.reduce((sum, order) => {
            return sum + order.pricingSummary.totalPaid;
          }, 0);

          res.send({
            totalOrders: orders.length,
            totalCartItems: cartItems.length,
            totalSpent,
          });
        } catch (error) {
          console.error(error);
          res.status(500).send({
            message: "Failed to fetch dashboard data",
          });
        }
      }
    );




    // admin dashboard infos
    app.get("/get-admin-infos", verifyToken, verifyAdmin, async (req: Request, res: Response) => {
      try {
        const users = await userColl.countDocuments();
        const orders = await ordersCollection.countDocuments();
        const activeProducts = await productsCollection.countDocuments();

        const [earningData] = await ordersCollection.aggregate([
          {
            $group: {
              _id: null,
              totalEarning: {
                $sum: "$pricingSummary.totalPaid",
              },
            },
          },
        ]).toArray();

        res.send({
          users,
          orders,
          activeProducts,
          totalEarning: earningData?.totalEarning || 0,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: "Failed to fetch admin dashboard data",
        });
      }
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



    // delete users
    app.delete("/packages/:id",verifyToken,verifyAdmin, async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const query = {
        _id: new ObjectId(id)
      }

      const result = await userColl.deleteOne(query);
      res.send(result);
    })


    // block unblock user
    app.patch("/update-status/:status/:id",verifyToken,verifyAdmin, async (req: Request, res: Response) => {
      const status = req.params.status;
      const id = req.params.id as string;
      console.log("user id ", id);

      const query = {
        _id: new ObjectId(id)
      }
      const updatedDoc = {
        $set: {
          status: status
        }
      }
      const result = await userColl.updateOne(query, updatedDoc)
      res.send(result)

    })

    // Ping database
    // await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB Ping Successful");
  } catch (error) {
    console.error(error);
  }
}

void run();

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

export default app;