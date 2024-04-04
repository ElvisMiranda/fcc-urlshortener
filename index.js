require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
  original_url: String, 
  short_url: String
});

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.send({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({extended: false}));
app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;

  if (!url.startsWith('http')) {
    res.send({ error: 'invalid url' });
    return;
  }

  let docCount = await Url.countDocuments({});

  await Url.findOne({ original_url: url })
    .then(async (data) => {
      if (data != null) {
        res.send({ original_url: data.original_url, short_url: data.short_url });

        return;
      }

      const newUrl = new Url({
        original_url: url,
        short_url: ++docCount
      });

      await newUrl.save()
        .then((data) => { 
          res.send({ original_url: data.original_url, short_url: data.short_url });
        })
        .catch((err) => {
          console.log(err);
        });
      
    })
    .catch((err) => { console.log(err); });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  Url.findOne({ short_url: req.params.short_url })
    .then((url) => { 
      if (url == null) {
        res.status(404).json({ error: 'Not Found'});
        return;
      }
      
      res.redirect(url.original_url); 
    })
    .catch((err) => { console.log(err); })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
