const request = require('request');

// Module for repharsing Google Sheets JSON format to a more general format
module.exports.clearFormatting = (googleSheetsCellFormat) => ({
    date: googleSheetsCellFormat['gsx$date']['$t'],
    tests: parseInt(googleSheetsCellFormat['gsx$tests']['$t']),
    positives: parseInt(googleSheetsCellFormat['gsx$positives']['$t']),
    quarbeds: parseInt(googleSheetsCellFormat['gsx$isoquarbeds']['$t']),
    occupiedquarbeds: parseInt(googleSheetsCellFormat['gsx$occupiedisoquarbeds']['$t']),
})

module.exports.stats = (callback) => {
    request('https://spreadsheets.google.com/feeds/list/1o3Lr_FLnngmVMx3oPGwh4XHK4B3jmiuXLGpKOsJN6mE/1/public/values?alt=json', (err, resp, body) => {
        let data = JSON.parse(body)['feed']['entry'];

        let summary = {
            tests: 0,
            positives: 0,

             // NOTE: These data points are cumulative
            quarbeds: 0,
            occupiedquarbeds: 0
        }

        let historical = [];

        data.forEach(day => {
            // Appending historal data to array
            days.push(this.clearFormatting(day))

            // Collecting specific stats for cumulative data points
            if(day['gsx$tests']['$t']){
                tests += parseInt(day['gsx$tests']['$t']);
            }
            if(day['gsx$positives']['$t']){
                positives += parseInt(day['gsx$positives']['$t']);
            }
        });

        let mostRecentDay = data[data.length - 1];
            mostRecentDay = this.clearFormatting(mostRecentDay);

        callback({
            summary,
            historical,
            mostRecentDay
        })
    })
}

