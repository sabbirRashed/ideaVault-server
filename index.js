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

        });

        app.get('/ideas/:userId', async(req, res)=>{
            const userId = req.params.userId;
            console.log("userId:", userId);
            const result = await ideasCollection.find({creatorId: userId}).toArray();
            res.send(result);
        })

        app.post('/ideas', async(req, res) =>{
            const newIdea = {
                ...req.body,
                createdAt: new Date()
            };
            const result = await ideasCollection.insertOne(newIdea);
            res.send(result);
        })

        app.patch('/idea/:ideaId', async(req, res)=>{
            const ideaId = await req.params.ideaId;
            const filter = {
                _id: new ObjectId(ideaId)
            };
            const modifiedIdea = {
                $set: req.body
            }
            const result = await ideasCollection.updateOne(filter, modifiedIdea);
            res.send(result);
        })

        // comments
        app.get("/comments/:ideaId", async(req, res)=>{
            const id = req.params.ideaId;
            const result = await commentCollection.find({ideaId:id}).toArray();
            res.send(result);
        });

        app.get("/comments/:userId", async(req, res)=>{
            const userId = req.params.userId;
            const result =await commentCollection({userId}).toArray();
            res.send(result);
        })

        app.post('/comments', async(req, res)=>{
            const newComment = {
                ...req.body,
                createdAt: new Date(),
            }
            const result = await commentCollection.insertOne(newComment);
            res.send(result);
        });

        app.patch('/comments/:id', async(req, res)=>{
            const id = req.params.id;

            const filter = {
                _id: new ObjectId(id)
            }
            const modifiedComment = {
                $set: req.body,
            }
            const result = await commentCollection.updateOne(filter, modifiedComment);
            res.send(result);
        });

        app.delete('/comments/:id', async(req, res)=>{
            const id = req.params.id;
            const result = await commentCollection.deleteOne({_id: new ObjectId(id)});
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
