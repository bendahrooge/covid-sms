const request = require('request');
const moment = require('moment')

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
            historical.push(this.clearFormatting(day))

            // Collecting specific stats for cumulative data points
            if(day['gsx$tests']['$t']){
                summary.tests += parseInt(day['gsx$tests']['$t']);
            }
            if(day['gsx$positives']['$t']){
                summary.positives += parseInt(day['gsx$positives']['$t']);
            }
        });

        // Gather the positvity rate for the last 7 days
        let last7days = {tests: 0, cases: 0};
        for(var i = historical.length - 8; i < historical.length; i++){
            // if(moment(historical[i].date, 'M/D/YYYY').add(6, 'days').isAfter(moment())){
                last7days.tests += historical[i].tests;
                last7days.cases += historical[i].positives;
            // }
        }

        let posRate7days = ((last7days.cases / last7days.tests) * 100).toFixed(2);

        let mostRecentDay = data[data.length - 1];
            mostRecentDay = this.clearFormatting(mostRecentDay);

        callback({
            summary,
            historical,
            mostRecentDay,
            posRate7days
        })
    })
}

