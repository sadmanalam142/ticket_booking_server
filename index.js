require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "7d" }
  );
  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  if (!verify?.email) {
    return res.send("You are not authorized");
  }
  req.user = verify.email;
  next();
}

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const ticket_booking_DB = client.db("ticket_booking_DB");
    const ticketCollection = ticket_booking_DB.collection("ticketCollection");
    const bookingCollection = ticket_booking_DB.collection("bookingCollection");
    const userCollection = ticket_booking_DB.collection("userCollection");

   //ticket
   app.get("/tickets", async (req, res) => {
    const ticketsData = ticketCollection.find();
    const result = await ticketsData.toArray();
    res.send(result);
  });

  app.get("/tickets/:id", async (req, res) => {
    const id = req.params.id;
    const ticketsData = await ticketCollection.findOne({
      _id: new ObjectId(id),
    });
    res.send(ticketsData);
  });

  //booking
  app.post("/booking", verifyToken, async (req, res) => {
    const bookingData = req.body;
    const result = await bookingCollection.insertOne(bookingData);
    res.send(result);
  });

  app.get("/booking/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const result = await bookingCollection.find(query).toArray();
    res.send(result);
  });
    
    // user
    app.post("/user", async (req, res) => {
      const user = req.body;

      const token = createToken(user);
      const isUserExist = await userCollection.findOne({ email: user?.email });
      if (isUserExist?._id) {
        return res.send({
          statu: "success",
          message: "Login success",
          token,
        });
      }
      await userCollection.insertOne(user);
      return res.send({ token });
    });

    console.log("Database is connected");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Route is working");
});

app.listen(port, (req, res) => {
  console.log("App is listening on port :", port);
});