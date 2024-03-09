var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Function to connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Connect to MongoDB when the application starts
connectToMongoDB();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/addcalories', async (req, res) => {
  try {
    const db = client.db('serversideproject'); //connect to the database
    const { user_id, year, month, day, description, category, amount } = req.body; //retrieve parameters form the body

    // Add new calorie consumption item
    await db.collection('calories').insertOne({
      user_id,
      year,
      month,
      day,
      description,
      category,
      amount,
    });
    res.status(201).json({ message: 'Calorie consumption added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/report', async (req, res) => {
  try {
    const db = client.db('serversideproject'); //connect to the database
    const { user_id, year, month } = req.query; //retrieve parameters from query string
    const catArr = ['breakfast', 'lunch', 'dinner', 'other'];

    const report = await db.collection('calories').aggregate([
      {
        //looking for documents with matching year,month and user id
        $match: {
          user_id: parseInt(user_id),
          year: parseInt(year),
          month: parseInt(month),
        },
      },
      {
        //group documents found by categories
        $group: {
          _id: '$category',
          items: {
            $push: {
              day: '$day',
              description: '$description',
              amount: '$amount',
            },
          },
        },
      },
    ]).toArray();

    const formattedReport = {};

    //adding empty representation of each category
    catArr.forEach(category=>{
      formattedReport[category]=[];
    })

    //fill categorises that aren't actually empty
    report.forEach(category => {
      formattedReport[category._id || 'other'] = category.items;
    });

    res.json(formattedReport);

    console.log('Formatted report: ', formattedReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/about', async (req,res) => {
  const devArr = [
    {
      'firstname':'Eyal',
      'lastname':'Chachmishvily',
      'id':209786094,
      'email':'eyalchachmi@gmail.com'
    },
    {
      'firstname':'Idan',
      'lastname':'Eliyahu',
      'id':204174155,
      'email':'idaneliyahu93@gmail.com'
    },
    {
      'firstname':'Shahar',
      'lastname':'Sivilia',
      'id':206375180,
      'email':'Shahars71@gmail.com'
    }
  ]

  res.json(devArr);
})



// Handle cleanup and close MongoDB connection when the application is shutting down
process.on('exit', () => {
  client.close();
  console.log('MongoDB connection closed on process exit');
});

module.exports = router;

