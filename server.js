const express = require("express")
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const covid = require("./modules/covid");
const sms = require("./modules/sms")

app.get('/api/covid', (req, res) => {
    if(req.header('X-Appengine-Cron') || process.env.NODE_ENV === 'development'){
  
      const key = datastore.key(["stats", "data"]);
      covid.stats((data) => {
    
        datastore.get(key, (err, entry) => {
            
            // Determine if the number of covid tests reported has changed
            if(entry.summary.tests === data.summary.tests && entry.summary.positives === data.summary.positives){

                // No new cases or tests, nothing else to do...
                
                // Respond the http request to prevent a App Engine timeout error being reported to Logger
                res.json({"status":"matches", "data": data, entry: entry});

            }else{
                // New or updated testing data exists, send an alert via SMS

                res.json({"status":"updated", "data": data, entry: entry});

                datastore.save({data: data, key: key}, (err) => {
    
                    // Send the updated notfications to the subscribers
                    sms.sendNotfiications(data, entry, true)
    
                })
          }
        })
      })  
    }else{
      res.json({"Success": false, "Reason":"Missing App Engine Cron Header"});
    }
  });
  

app.get('/api/incoming', function(req, res){
  sms.handleIncoming(req, res)
})

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
  // helper.daily_meme();
});

module.exports = app;
