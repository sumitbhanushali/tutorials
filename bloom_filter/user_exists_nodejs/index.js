import express from 'express';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

const client = createClient();
await client.connect();

const bfKey = 'username-bloom-filter';

// delete pre-existing bloom filter 
await client.del(bfKey);

try {
    //key, error_rate, capacity
    //error rate should be between 0 and 1, 0.01 means false positive 1 in 100
    //capacity is number of entries that can be stored
    await client.bf.reserve(bfKey, 0.01, 1000);
    console.log('Reserved Bloom Filter.');
} catch (e) {
    if (e.message.endsWith('item exists')) {
        console.log('Bloom Filter already reserved.');
    } else {
        console.log('Error, maybe RedisBloom is not installed?:');
        console.log(e);
    }
}

app.get('/user', async function (req, res) {
    const result = await client.bf.exists(
        bfKey,
        req.query.username,
    );

    res.send({
        username: req.query.username,
        status: result ? 'found' : 'not found'
    });
});

app.post('/user/create', async function (req, res) {
    const result = await client.bf.exists(bfKey, req.body.username);
    if (!result) {
        await client.bf.add(
            bfKey,
            req.body.username,
        );
        res.send({ username: req.body.username, status: 'created' });
    } else {
        res.send({ username: req.body.username, status: 'already created' });
    }
});

app.listen(3000);