const conf = require('../config/config');
const NodePrefs = require('node-prefs');


    let rdispositive = (rustplus,mdispositive,teamMenSender) =>{  
        const dist = new NodePrefs({fileName: "config-dis.js"});
        //var dis = dispositives.indexOf(mdispositive.split(" ",2)[1]);   
            if (dist.has(mdispositive.split(" ",2)[1])){
                var dispositiveid = dist.get(mdispositive.split(" ",2)[1]);
                if (mdispositive.split(" ",2)[0] == ":off") {
                    console.log("Off "+ mdispositive.split(" ",2)[1]);
                    rustplus.turnSmartSwitchOff(dispositiveid, (message) => {});
                    rustplus.sendTeamMessage('GLaDOS: '+mdispositive.split(" ",2)[1]+' desactivada/o '+teamMenSender);
                }
                if (mdispositive.split(" ",2)[0] == ":on") {
                    console.log("On "+ mdispositive.split(" ",2)[1]);
                    rustplus.turnSmartSwitchOn(dispositiveid, (message) => {});
                    rustplus.sendTeamMessage('GLaDOS: '+mdispositive.split(" ",2)[1]+' activada/o '+teamMenSender);
                }
                 
            } else {
                rustplus.sendTeamMessage('GLaDOS: '+mdispositive.split(" ",2)[1]+' no encontrado '+teamMenSender);

            }
            
    rustplus.connect();
    
    };
    
module.exports = rdispositive;
    