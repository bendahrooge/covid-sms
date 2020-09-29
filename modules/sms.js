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
            smsMessage += newCases + " new cases were reported; "
        }
    }

    smsMessage += 'On ' + updatedData.mostRecentDay.date + " there were " + 
        updatedData.mostRecentDay.positives + " positives out of " + updatedData.mostRecentDay.tests + 
        " tests. "

    smsMessage += "Source: uri.edu/healthservices/covid-19/tracker. "

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