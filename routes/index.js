var express = require('express');
var router = express.Router();
import { CosmosClient } from '@azure/cosmos';

const key = process.env.COSMOS_KEY;
const endpoint = process.env.COSMOS_ENDPOINT;

const client = new CosmosClient({ endpoint, key });

const databaseName = 'db1';
const { database } = await client.databases.createIfNotExists({ id: databaseName });
console.log(`${database.id} database ready`);

const userContainer = database.container('users');
const pushupContainer = database.container('pushup_records');

router.get('/users', async (req, res) => {
  const { resources: users } = await userContainer.items.readAll().fetchAll();
  res.json(users);
});

router.get('/pushups', async (req, res) => {
  const { resources: pushups } = await pushupContainer.items.readAll().fetchAll();
  res.json(pushups);
});

router.post('/pushups', async (req, res) => {
  const { body } = req;
  const { resources: users } = await userContainer.items.readAll().fetchAll();
  const user = users.find(user => user.id === body.userId);
  if (!user) {
    res.status(400).send('User not found');
    return;
  }
  const { resources: pushups } = await pushupContainer.items.readAll().fetchAll();
  const pushup = pushups.find(pushup => pushup.id === body.id);
  if (pushup) {
    res.status(400).send('Pushup already exists');
    return;
  }
  const { resource: createdPushup } = await pushupContainer.items.create(body);
  res.json(createdPushup);
});

router.get('/pushups/:id', async (req, res) => {
  const { id } = req.params;
  const { resource: pushup } = await pushupContainer.item(id).read();
  res.json(pushup);
});

router.put('/pushups/:id', async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const { resource: pushup } = await pushupContainer.item(id).replace(body);
  res.json(pushup);
});

router.delete('/pushups/:id', async (req, res) => {
  const { id } = req.params;
  await pushupContainer.item(id).delete();
  res.status(204).send();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
