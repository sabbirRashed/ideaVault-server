const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const run = async () => {
    try {

        await client.connect();

        const db = client.db('SparkNest');
        const ideasCollection = db.collection('ideas');
        const commentCollection = db.collection('comments');

        // ideas
        app.get('/ideas', async (req, res) => {
            const result = await ideasCollection.find().toArray();
            res.send(result);
        })

        app.get('/ideaDetails/:id', async(req, res)=>{
            const id = req.params.id;
            const result = await ideasCollection.findOne({_id: new ObjectId(id)});
            res.send(result);

        })

        app.post('/ideas', async(req, res) =>{
            const newIdea = {
                ...req.body,
                createdAt: new Date()
            };
            const result = await ideasCollection.insertOne(newIdea);
            console.log("after post:",result);
            res.send(result);
        })

        // comments
        app.get("/comments", async(req, res)=>{
            const result = await commentCollection.find().toArray();
            res.send(result);
        });

        app.post('/comments/', async(req, res)=>{
            const newComment = {
                ...req.body,
                createdAt: new Date(),
            }
            const result = await commentCollection.insertOne(newComment);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send('Hello from express server')
})


app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})
