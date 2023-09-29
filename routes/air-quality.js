var express = require('express');
var router = express.Router();
var {body, validationResult} = require('express-validator')
const fs = require('fs');
const readline = require('readline');

const postValidator = [
    body('timestamp', 'Bad request').exists().not().isEmpty(),
    body('tvoc', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('tvoc_min', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('tvoc_max', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('tvoc_avg', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('eco2', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('eco2_min', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('eco2_max', 'Bad request').exists().not().isEmpty().isNumeric(),
    body('eco2_avg', 'Bad request').exists().not().isEmpty().isNumeric()
]

// Create a function to convert an object to a CSV string
function objectToCsvRow(obj) {
    const values = Object.values(obj);
    const escapedValues = values.map(value => `${value}`);
    return escapedValues.join(',') + '\n';
}

router.post('/', postValidator, (req, res) => {
    // #swagger.description = 'Post data about TVOC and eCO2 values from Core2',
    /*  #swagger.parameters['sensorData'] = {
                in: 'body',
                required: true,
                schema: {
                    $timestamp: '2023-09-22T14:30:00Z',
                    $tvoc: 50,
                    $tvoc_min: 30,
                    $tvoc_max: 70,
                    $tvoc_avg: 50,
                    $eco2: 400,
                    $eco2_min: 300,
                    $eco2_max: 500,
                    $eco2_avg: 400
                 }
        } */
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const csvRow = objectToCsvRow(req.body);
        // it's async so we need else for bad request - otherwise it'll go there in the meantime
        fs.writeFile('data/core2_measurements.csv', csvRow, (err) => {
            if (err) {
                console.error('Error appending data to the CSV file:', err);
                return res.status(500).json({message: 'Internal Server Error'});
            } else {
                console.log('Data appended to core2_measurements.csv successfully.');
                return res.status(200).json({message: 'Data appended successfully.'});
            }
        });
    } else {
        res.status(400).json({status: 400, message: "Bad request"});
    }
})

router.get('/eco2', function(req, res, next) {
    // #swagger.description = 'Get most recent data about eCO2 values from Core2 senting it to the MQTT broker.'
    const fileStream = fs.createReadStream('data/mqtt_measurements.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        if(!line) {
            return res.status(404).json({status: 404, message: "No data"})
        }
        const properties = line.split(',')
        const eco2 = properties[2];
        return res.status(200).json({eco2})
    })

});

router.get('/tvoc', function(req, res, next) {
    // #swagger.description = 'Get most recent data about TVOC values from Core2 senting it to the MQTT broker.'
    const fileStream = fs.createReadStream('data/mqtt_measurements.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        if(!line) {
            return res.status(404).json({status: 404, message: "No data"})
        }
        const properties = line.split(',')
        const tvoc = properties[0]
        return res.status(200).json({tvoc})
    })
});

router.get('/latestData/:type?', function(req, res, next) {
    const type = req.params.type;
    if(!type) {
        return res.status(400).json({status: 400, message: "Missing type parameter"})
    }
    // #swagger.description = 'Get most recent complete data from Core2 or MQTT depending on `type` parameter.'
    /*  #swagger.parameters['type'] = {
                in: 'path',
                required: true
                description: Type of source to use for data. Either core2 or mqtt.
        } */
    /* #swagger.responses[200] = {
            description: 'OK',
            content: 'application/json',
            schema: {
                    timestamp: '2023-09-22T14:30:00Z',
                    tvoc: 50,
                    tvoc_min: 30,
                    tvoc_max: 70,
                    tvoc_avg: 50,
                    eco2: 400,
                    eco2_min: 300,
                    eco2_max: 500,
                    eco2_avg: 400,
                    origin: 'mqtt'
                 }
            } */
    var fileStream;
    if (type == 'mqtt') {
        fileStream = fs.createReadStream('data/mqtt_measurements.csv');
    } else if(type == 'core2'){
        fileStream = fs.createReadStream('data/core2_measurements.csv');
    } else {
        return res.status(400).json({status: 400, message: "Invalid type parameter"})
    }

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        if(!line) {
            return res.status(404).json({status: 404, message: "No data"})
        }
        const properties = line.split(',')
        const data = {
            tvoc: properties[0],
            tvoc_max: properties[1],
            eco2: properties[2],
            eco2_max: properties[3],
            timestamp: properties[4],
            tvoc_avg: properties[5],
            eco2_avg: properties[6],
            eco2_min: properties[7],
            tvoc_min: properties[8],
            origin: type
        };

        return res.status(200).json({status: 200, body: data});
    })
});

module.exports = router;