const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
var mqtt = require('mqtt')

const options = {
    protocol: 'mqtts',
    host: 'https://myggen.mooo.com/',
    port: 8883,
    username: 'DaringDo',
    password: 'ms1tE3W9nJv4lRKy'
};

var client  = mqtt.connect(options)

const app = express();
const port = 3000;

// Data validation middleware
const validateData = [
    body('timestamp').isISO8601().toDate(),
    body('tvoc_current').isInt(),
    body('tvoc_min').isInt(),
    body('tvoc_max').isInt(),
    body('tvoc_average').isInt(),
    body('eco2_current').isInt(),
    body('eco2_min').isInt(),
    body('eco2_max').isInt(),
    body('eco2_average').isInt(),
];

// Data to append to the CSV file
const dataToAppend = {
    timestamp: '2023-09-22T14:30:00Z',
    tvoc_current: 50,
    tvoc_min: 30,
    tvoc_max: 70,
    tvoc_average: 50,
    eco2_current: 400,
    eco2_min: 300,
    eco2_max: 500,
    eco2_average: 400,
};

// Create a function to convert an object to a CSV string
function objectToCsvRow(obj) {
    const values = Object.values(obj);
    const escapedValues = values.map(value => "${value}");
    return escapedValues.join(',') + '\n';
}

// Define a route to handle data validation and appending to CSV
app.post('/append', validateData, (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const csvRow = objectToCsvRow(dataToAppend);

    // Append data to the CSV file
    fs.appendFile('core2_measurements.csv', csvRow, (err) => {
        if (err) {
            console.error('Error appending data to the CSV file:', err);
            return res.status(500).send('Internal Server Error');
        } else {
            console.log('Data appended to core2_measurements.csv successfully.');
            return res.status(200).send('Data appended successfully.');
        }
    });
});

app.listen(port, () => {
    console.log(Server is running on port ${port});
});