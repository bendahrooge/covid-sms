const keys = require("./../keys.json")

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

const { RestClient } = require('@signalwire/node')
const client = new RestClient( keys.signalwire_client, keys.signalwire_secret, { signalwireSpaceUrl: keys.signalwire_wspace })

module.exports.sendNotfiications = (updatedData, previousData, send = false) => {
    let smsMessage = '';

    let newCases = updatedData.summary.positives - previousData.summary.positives
    if(newCases === 0){
        // Don't send an update for no new cases
        send = false; 
    }else{
        if(newCases > 0){
            smsMessage += newCases + " new cases reported; "
        }
    }

    smsMessage += 'On ' + updatedData.mostRecentDay.date + " there were " + 
        updatedData.mostRecentDay.positives + " positives out of " + updatedData.mostRecentDay.tests + 
        " tests. "

    smsMessage += "More @ uri.edu/healthservices/covid-19/tracker. "

    // Prevent the message from splitting into two segements
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
      }else {
        // add to list
        let t = req.query.Body.toLocaleLowerCase();
  
        if(true){
          if(people.indexOf(req.query.From) > -1){
            // Already subscribed
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