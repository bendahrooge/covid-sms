const keys = require("./../keys.json")

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const { RestClient } = require('@signalwire/node')
const client = new RestClient( keys.signalwire_client, keys.signalwire_secret, { signalwireSpaceUrl: keys.signalwire_wspace })

module.exports.sendNotfiications = (updatedData, previousData, send = false) => {
    let smsMessage = '';

    let newCases = updatedData.summary.positives - previousData.summary.positives
    if(newCases === 0){
          // New tests but no new cases...
          smsMessage += "No new cases reported; "
    }else{
        if(newCases > 0){
            smsMessage += newCases + " new cases reported; "
        }else if(newCases < 0){
            smsMessage += "A correction was posted: " + newCases + " new cases reported; "
        }
    }

    if(updatedData.posRate7days){
      smsMessage += "7 day positivity rate: " + updatedData.posRate7days + '%; '
    }

    smsMessage += 'On ' + updatedData.mostRecentDay.date + " there were " + 
        updatedData.mostRecentDay.positives + " positives out of " + updatedData.mostRecentDay.tests + 
        " tests. "

    // Prevent the message from splitting into two segements
    if(smsMessage.length < 117){
      smsMessage += "More @ uri.edu/healthservices/covid-19/tracker. "
    }

    if(smsMessage.length < 138){
        smsMessage += "Reply STOP to cancel."
    }

    if(send){

        if(process.env.NODE_ENV !== 'development'){
            const key = datastore.key(["contacts", "subs"]);

            datastore.get(key, (err, entry) => {
  
              for(var i = 0; i < entry.default.length; i++){
                client.messages
                .create({from: '+18885000119', body: smsMessage, to: entry.default[i]})
                .then(message => console.log(message))
                .done();
              }
            });
        }else{
            client.messages
            .create({from: '+18885000119', body: smsMessage, to: '+14014051096'})
            .then(message => console.log(message))
            .done();
        }

    }

}

module.exports.handleIncoming = (req, res) => {
    const key = datastore.key(["contacts", "subs"]);
    datastore.get(key, (err, entry) => {

      let people;
  
        if(entry != undefined){
          people = entry.default;
        }else{
          people = [];
        }
  
        res.send({data: people})
  
      if(req.query.Body.toLocaleLowerCase().indexOf("stop") >= 0){
        // unsubscribe from list
        people.splice(people.indexOf(req.query.From), 1);

        client.messages
        .create({from: '+18885000119', body: "You have been unsubscribed and will not recieve any further messages. To recieve alerts again, text START to this number.", to: req.query.From})
        .then(message => console.log(message))
        .done();

      }else {
        // add to sms list 

        if(req.query.Body.toLocaleLowerCase().indexOf("covid") >= 0 ||
           req.query.Body.toLocaleLowerCase().indexOf("start") >= 0 ||
           req.query.Body.toLocaleLowerCase().indexOf("uri") >= 0){
            if(people.indexOf(req.query.From) > -1){
            // Already subscribed, do nothing

            }else{
              people.push(req.query.From);
              client.messages
              .create({from: '+18885000119', body: "You've been subsrcd to: Covid-19 Daily Case Updates (URI). Updates will send daily when new data is published betwn 9am-12pm EST. Reply STOP anytime to cancel.", to: req.query.From})
              .then(message => console.log(message))
              .done();
            }
        }
      }
  
        datastore.save({data: {default: people}, key: key}, (err) => {
          console.log(err)
        })
      
    })
}