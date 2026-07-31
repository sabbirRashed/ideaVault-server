const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const varifyToken = async (req, res, next) => {
    const authHeader = req?.headers?.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized' });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS,)
        next()
    }
    catch (error) {
        return res.status(403).send({ message: "Forbidden" })
    }

}

const run = async () => {
    try {
        // await client.connect();

        const db = client.db('SparkNest');
        const ideasCollection = db.collection('ideas');
        const commentCollection = db.collection('comments');

        // ideas
        app.get('/ideas', async (req, res) => {
            const { search, category, sort= 'new' } = req.query;

            const query = {};

            if (search) {
                query.ideaTitle = {
                    $regex: search,
                    $options: 'i'
                }
            }
            if (category) {
                query.category = category;
            }

            let cursor = ideasCollection.find(query);

            if (sort === "new") {
                cursor = cursor.sort({ createdAt: -1 });
            }
            if (sort === "old") {
                cursor = cursor.sort({ createdAt: 1 });
            }

            const result = await cursor.toArray();
            console.log(result);
            res.send(result);
        })

        app.get('/ideaDetails/:id', varifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await ideasCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get('/ideas/:userId', varifyToken, async (req, res) => {
            const userId = req.params.userId;
            const result = await ideasCollection.find({ creatorId: userId }).toArray();
            res.send(result);
        })

        app.get('/trendingIdeas', async(req, res)=>{
            const result = await ideasCollection.find().limit(2).toArray();
            res.send(result);
        })

        app.post('/ideas', varifyToken, async (req, res) => {
            const newIdea = {
                ...req.body,
                createdAt: new Date()
            };
            const result = await ideasCollection.insertOne(newIdea);
            res.send(result);
        })

        app.patch('/ideas/:ideaId', varifyToken, async (req, res) => {
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

        app.delete('/ideas/:ideaId', varifyToken, async (req, res) => {
            const id = req.params.ideaId;
            const result = await ideasCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        })

        // comments
        app.get("/comments/idea/:ideaId", varifyToken, async (req, res) => {
            const id = req.params.ideaId;
            const result = await commentCollection.find({ ideaId: id }).toArray();
            res.send(result);
        });

        app.get("/comments/user/:userId", varifyToken, async (req, res) => {
            const userId = req.params.userId;
            const result = await commentCollection.find({ userId }).toArray();
            res.send(result);
        })

        app.post('/comments', varifyToken, async (req, res) => {
            const newComment = {
                ...req.body,
                createdAt: new Date(),
            }
            const result = await commentCollection.insertOne(newComment);
            res.send(result);
        });

        app.patch('/comments/:id', varifyToken, async (req, res) => {
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

        app.delete('/comments/:id', varifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await commentCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        })


        // await client.db("admin").command({ ping: 1 });
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
