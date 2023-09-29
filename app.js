var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')
const mqtt = require("mqtt");
const fs = require("fs");
var indexRouter = require('./routes/index');
var airQualityRouter = require('./routes/air-quality');

var app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/sensors/air-quality/', airQualityRouter);
app.use('/openapi', swaggerUi.serve, swaggerUi.setup(swaggerFile))
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(express.static('a3_frontend/dist/a3_frontend/'))

const protocol = 'mqtts';
const host = 'myggen.mooo.com';
const port = '8883';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `${protocol}://${host}:${port}`
const topic = 'DaringDo/core2'

// Create a function to convert an object to a CSV string
function objectToCsvRow(obj) {
  const values = Object.values(obj);
  const escapedValues = values.map(value => `${value}`);
  return escapedValues.join(',') + '\n';
}

var client  = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'DaringDo',
  password: 'ms1tE3W9nJv4lRKy',
  reconnectPeriod: 1000
})

client.on('connect', () => {
  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})

client.on("message", (topic, message) => {
  // message is Buffer
  const csvRow = objectToCsvRow(JSON.parse(message.toString()));
  // it's async so we need else for bad request - otherwise it'll go there in the meantime
  fs.writeFile('data/mqtt_measurements.csv', csvRow, (err) => {
    if (err) {
      console.error('Error appending data to the CSV file:', err);
    } else {
      console.log('Data appended to mqtt_measurements.csv successfully.');
    }
  });
});
module.exports = app;
