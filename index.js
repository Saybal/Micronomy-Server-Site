const express = require("express");
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.shp35fl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const workersCollection = client.db("Micronomy").collection("Workers");
    const adminsCollection = client.db("Micronomy").collection("Admins");
    const buyersCollection = client.db("Micronomy").collection("Buyers");
    const taskCollection = client.db("Micronomy").collection("AddTask");
    const coinsCollection = client.db("Micronomy").collection("coins");
    const paymentsCollection = client.db("Micronomy").collection("payments");
    const notificationsCollection = client
      .db("Micronomy")
      .collection("Notifications");
    const workersSubmissions = client
      .db("Micronomy")
      .collection("Workers_Submissions");
    const withdraw = client.db("Micronomy").collection("Withdraw");
    const clients = client.db("Micronomy").collection("Clients");

    // !Fetching all clients tasks
    app.get("/addtask", async (req, res) => {
      const sortFields = { coins: -1 };
      const cursor = taskCollection.find().sort(sortFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !Fetching individual task by ID
    app.get("/addtask/:id", async (req, res) => {
      const ID = req.params.id;
      const query = { _id: new ObjectId(ID) };
      const cursor = taskCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Fecthing tasks by email
    app.get("/addtask/email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { buyer_email: email };
      const cursor = taskCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !!For All Workers
    app.get("/allworkers", async (req, res) => {
      const sortFields = { coins: -1 };
      const cursor = workersCollection.find().sort(sortFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !!Worker individual
    app.get("/allworkers/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email: email };
      const cursor = workersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !For clients reviews
    app.get("/testimonials", async (req, res) => {
      const cursor = clients.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/purchase-plans", async (req, res) => {
      const cursor = coinsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // !For All buyers
    app.get("/allbuyers", async (req, res) => {
      const sortFields = { coins: -1 };
      const cursor = buyersCollection.find().sort(sortFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !buyer indivisual
    app.get("/allbuyers/:email", async (req, res) => {
      const Email = req.params.email;
      const query = { email: Email };
      const cursor = buyersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !For All admins
    app.get("/alladmins", async (req, res) => {
      const sortFields = { coins: -1 };
      const cursor = adminsCollection.find().sort(sortFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !For Admin indivisual
    app.get("/alladmins/:email", async (req, res) => {
      const Email = req.params.email;
      const query = { email: Email };
      const cursor = adminsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allwithdraws", async (req, res) => {
      // const sortFields = { coins: -1 };
      const cursor = withdraw.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // !Getting individual purchase plan
    app.get("/purchase-plans/:id", async (req, res) => {
      const ID = req.params.id;
      const query = { _id: new ObjectId(ID) };
      const cursor = coinsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !Getting individual payment history
    app.get("/payments/:email", async (req, res) => {
      const Email = req.params.email;
      const query = { useremail: Email };
      const cursor = paymentsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // !Worker's submissions
    app.get("/submissions", async (req, res) => {
      try {
        const buyerEmail = req.query.buyer_email;
        const status = req.query.status;

        // console.log("Buyer Email:", buyerEmail);
        // console.log("Status:", status);

        const query = {
          ...(buyerEmail && { Buyer_email: buyerEmail }), // capital B
          ...(status && { status: status }),
        };

        const result = await workersSubmissions.find(query).toArray();
        // console.log("Submissions fetched:", result);
        res.send(result);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).send({ error: "Failed to fetch submissions" });
      }
    });

    // !Worker's individual submissions
    app.get("/submissions/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const total = await workersSubmissions.countDocuments({
          worker_email: email,
        });
        const submissions = await workersSubmissions
          .find({ worker_email: email })
          .skip(skip)
          .limit(limit)
          .sort({ current_date: -1 })
          .toArray();

        const totalPages = Math.ceil(total / limit);

        res.send({ submissions, totalPages });
      } catch (err) {
        res.status(500).send({ message: "Server Error", error: err.message });
      }
    });

    // !fetching notifications
    app.get("/notifications", async (req, res) => {
      const { toEmail, toRole } = req.query;
      const query = {};

      if (toEmail) query.toEmail = toEmail;
      if (toRole) query.toRole = toRole;

      const notifications = await db
        .collection("notifications")
        .find(query)
        .toArray();
      res.send(notifications);
    });

    // ! Posting All tasks
    app.post("/addtask", async (req, res) => {
      const task = req.body;
      console.log(task);
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    // !Posting Worker
    app.post("/allworkers", async (req, res) => {
      const users = req.body;
      // console.log(users);
      const result = await workersCollection.insertOne(users);
      res.send(result);
    });

    // !Posting buyer
    app.post("/allbuyers", async (req, res) => {
      const users = req.body;
      // console.log(users);
      const result = await buyersCollection.insertOne(users);
      res.send(result);
    });

    // !Posting Admin
    app.post("/alladmins", async (req, res) => {
      const admin = req.body;
      // console.log(admin);
      const result = await adminsCollection.insertOne(admin);
      res.send(result);
    });

    // !Posting witdraw request
    app.post("/withdrawals", async (req, res) => {
      const withdrawRequest = req.body;
      // console.log(withdrawRequest);
      const result = await withdraw.insertOne(withdrawRequest);
      res.send(result);
    });

    // !Storing worker's submission
    app.post("/submissions", async (req, res) => {
      try {
        const submission = req.body;

        if (!submission.task_id || !submission.worker_email) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await workersSubmissions.insertOne(submission);
        res.status(201).json({
          message: "Submission stored successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error storing submission:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // !For Payment
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: req.body.amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // !for storing payment data/history
    app.post("/payments", async (req, res) => {
      try {
        const paymentData = req.body;

        const newPayment = {
          username: paymentData.username,
          useremail: paymentData.useremail,
          method: paymentData.method, // "card" or "paypal"
          coin: paymentData.coin,
          price: paymentData.price,
          date: paymentData.date, // "19-07-2025"
          time: paymentData.time, // "1:40 PM"
        };

        const result = await paymentsCollection.insertOne(newPayment);
        res.send(result);
      } catch (error) {
        console.error("Error saving payment:", error);
        res.status(500).send("Failed to save payment");
      }
    });

    // !Posting Notifications
    app.post("/notifications", async (req, res) => {
      try {
        const notification = req.body;
        const result = await notificationsCollection.insertOne(notification);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to save notification" });
      }
    });

    app.patch("/allbuyers/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: { coins: updatedData.coins },
      };
      const result = await buyersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // !Incrementing coins for registered users after a successful payment
    app.patch("/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const { incrementBy } = req.body;

      try {
        const result = await buyersCollection.updateOne(
          { email },
          { $inc: { coins: incrementBy } } // This line increments the coin value
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to update coins" });
      }
    });

    // !Individual submission by ID for approval
    app.patch("/submissions/:id", async (req, res) => {
      const ID = req.params.id;
      const { status } = req.body;
      const query = { _id: new ObjectId(ID) };
      const updateDoc = {
        $set: { status: status },
      };
      const result = await workersSubmissions.updateOne(query, updateDoc);
      res.send(result);
    });

    // !Increasing coins for workers after a successful approval by client
    app.patch("/allworkers/:email", async (req, res) => {
      const email = req.params.email;
      const { add } = req.body;

      try {
        const result = await workersCollection.updateOne(
          { email },
          { $inc: { coins: add } } // This line increments the coin value
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to update coins" });
      }
    });

    // !Decrementing required workers and total payable coins after approval
    app.patch("/addtask/:id", async (req, res) => {
      const ID = req.params.id;
      const { dec } = req.body;

      if (!ObjectId.isValid(ID)) {
        return res.status(400).send({ error: "Invalid Task ID" });
      }

      if (isNaN(dec)) {
        return res.status(400).send({ error: "Invalid payable amount" });
      }

      try {
        const result = await taskCollection.updateOne(
          { _id: new ObjectId(ID) },
          {
            $inc: {
              required_workers: -1,
              total_payable: -dec,
            },
          }
        );
        res.send(result);
      } catch (err) {
        console.error("Error in updating task:", err.message);
        res.status(500).send({ error: "Failed to update task" });
      }
    });

    // !Decrementing coins of registered users after approval
    app.patch("/buyer/approve/:email", async (req, res) => {
      const email = req.params.email;
      const { dec } = req.body;

      try {
        const result = await buyersCollection.updateOne(
          { email },
          { $inc: { coins: -dec } } // This line decrements the coin value
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to update coins" });
      }
    });

    // !Decrementing coins of worker after withdrawal
    app.patch("/worker/:email", async (req, res) => {
      const email = req.params.email;
      const { dec } = req.body;

      try {
        const result = await workersCollection.updateOne(
          { email },
          { $inc: { coins: -dec } } // This line decrements the coin value
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to update coins" });
      }
    });

    app.patch("/allwithdraws/:id", async (req, res) => {
      const ID = req.params.id;
      const { status } = req.body;
      const query = { _id: new ObjectId(ID) };
      const updateDoc = {
        $set: { status: status },
      };
      const result = await withdraw.updateOne(query, updateDoc);
      res.send(result);
    });

    // !Edit addtask
    app.put("/addtask/:id", async (req, res) => {
      const ID = req.params.id;
      const updatedTask = { ...req.body };

      if (!ObjectId.isValid(ID)) {
        return res.status(400).send({ error: "Invalid Task ID" });
      }

      // !Remove _id to prevent immutable update error
      delete updatedTask._id;

      try {
        const result = await taskCollection.updateOne(
          { _id: new ObjectId(ID) },
          { $set: updatedTask }
        );
        res.send(result);
      } catch (err) {
        console.error("Error in updating task:", err.message);
        res.status(500).send({ error: "Failed to update task" });
      }
    });

    // !Refund buyer's coins after task deletion
    app.patch("/buyers/:email", async (req, res) => {
      const email = req.params.email;
      const { coins } = req.body;

      if (typeof coins !== "number") {
        return res.status(400).send({ error: "Coins must be a number" });
      }

      try {
        const result = await buyersCollection.updateOne(
          { email },
          { $inc: { coins: coins } } // add coins back
        );

        if (result.modifiedCount === 0) {
          return res.status(404).send({ error: "User not found" });
        }

        res.send({ message: "Coins refilled successfully", result });
      } catch (err) {
        console.error("Error updating coins:", err.message);
        res.status(500).send({ error: "Failed to update coins" });
      }
    });

    // !Deleting a task
    app.delete("/addtask/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid Task ID" });
      }

      try {
        const result = await taskCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Task not found" });
        }

        res.send({ message: "Task deleted successfully" });
      } catch (err) {
        console.error("Error deleting task:", err.message);
        res.status(500).send({ error: "Failed to delete task" });
      }
    });

    // !Delewting a worker
    app.delete("/allworkers/:email", async (req, res) => {
      const email = req.params.email;

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      try {
        const result = await workersCollection.deleteOne({ email: email });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Worker not found" });
        }

        res.send({ message: "Worker deleted successfully" });
      } catch (err) {
        console.error("Error deleting worker:", err.message);
        res.status(500).send({ error: "Failed to delete worker" });
      }
    });
    // !Deleting a buyer
    app.delete("/allbuyers/:email", async (req, res) => {
      const email = req.params.email;

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      try {
        const result = await buyersCollection.deleteOne({ email: email });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Buyer not found" });
        }

        res.send({ message: "Buyer deleted successfully" });
      } catch (err) {
        console.error("Error deleting buyer:", err.message);
        res.status(500).send({ error: "Failed to delete buyer" });
      }
    });

    // !Deleting an admin
    app.delete("/alladmins/:email", async (req, res) => {
      const email = req.params.email;

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      try {
        const result = await adminsCollection.deleteOne({ email: email });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Admin not found" });
        }

        res.send({ message: "Admin deleted successfully" });
      } catch (err) {
        console.error("Error deleting admin:", err.message);
        res.status(500).send({ error: "Failed to delete admin" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
