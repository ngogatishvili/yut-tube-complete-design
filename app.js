const express = require('express');

const app = express();
require('express-async-errors');
const cors = require('cors');

app.use(cors());
const port = 5000;
app.use(express.static('images'));

const authorization = require('./middleware/authorization');
const user = require('./routes/User');
const todos = require('./routes/Todos');

require('dotenv').config();
const connectDB = require('./connect/connect');

app.use(express.json({ limit: '30mb', extended: true }));

const notFoundMiddleware = require('./middleware/notFound');


app.use('/api/v1/todos', authorization, todos);
app.use('/api/v1/auth', user);

app.use(notFoundMiddleware);


app.use((err,req,res,next)=>{
  console.log(err);
  const status=err.status||500;
  const message=err.message||"Something went wrong";
  return res.status(status).json({
    success:false,
    status,
    message
  })
})

    
const run = async () => {
  try {
    await connectDB('mongodb://localhost:27017/todoProject');
    app.listen(port, console.log(`server is listening to the port ${port}`));
  } catch (err) {
    console.log(err);
  }
};

run();
