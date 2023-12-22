const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
 })

app.get('/sam', (req, res) => {
    res.send('Name:O HaeWon')
 })

  
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});




 