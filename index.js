
console.log('Init GLaDOS');

const conf = require('./config/config');
const RustPlus = require('@liamcottle/rustplus.js');
const rtime = require('./functions/rtime');
const rcargo = require('./functions/rtime');
const rstatus = require('./functions/rstatus');
const rcraftcost = require('./functions/rcraftcost');
const rdispositive = require('./functions/rdispositive');
const rnote = require('./functions/rnote');
var rustplus = new RustPlus(conf.server.ip, conf.server.port, conf.user.steamid, conf.user.token);
const NodePrefs = require('node-prefs');

const dist = new NodePrefs({fileName: "config-dis.js"});


rustplus.on('connected', () => {
    rustplus.getEntityInfo(67787, (message) => {
        //console.log(JSON.stringify(message));

    });
    
});

// listen for messages from rust server
rustplus.on('message', (message) => {
    // check if message is an entity changed broadcast
    if(message.broadcast && message.broadcast.entityChanged){

        /**
         * since we called getEntityInfo, this message handler will be triggered
         * when the entity state has changed. for example, when a smart alarm is triggered,
         * a smart switch is toggled or a storage monitor has updated.
         */

        var entityChanged = message.broadcast.entityChanged;

        // log the broadcast
        console.log(message.broadcast);

        var entityId = entityChanged.entityId;
        var value = entityChanged.payload.value;

        // log the entity status
        console.log("entity " + entityId + " is now " + (value ? "active" : "inactive"));

    }

    if(message.broadcast && message.broadcast.teamMessage){
        var teamMen = message.broadcast.teamMessage.message.message;
        var teamMenSender = message.broadcast.teamMessage.message.name;
        var teamMenSenderId = message.broadcast.teamMessage.message.steamId;

        
         if (teamMen.startsWith(':')) {
            console.log("Mensaje = "+ teamMen + " Enviado por " + teamMenSender); 
            var command = teamMen.split(":")[1];
            command = command.split(" ")[0];

            switch(command) {
                case "off" : case  "on" :
                    rdispositive(rustplus,teamMen,teamMenSender);
                    break;
                case "time" : 
                    rtime(rustplus,teamMenSender);
                    break;
                case "status" :   
                    rustplus.sendTeamMessage("GlaDOS: aun no termina de funcionar");
                    rstatus(rustplus,teamMenSender);
                    break;
                case "map" : 
                    rustplus.sendTeamMessage("GlaDOS: hey no tan rapido celebrito");
                    //rustplus.getMapMarkers((message) => {
                    //    console.log(JSON.stringify(message.response));
                    //});
                    break;
                case "save" : 
                    const listener = new NodePrefs({fileName: "config-s.js"});
                    console.log(listener.keys()[0]);
                    rustplus.sendTeamMessage("GlaDOS: Guardando "+teamMen.split(' ')[1]+" con id "+listener.keys()[0]);
                    dist.set(teamMen.split(' ')[1],listener.keys()[0]);
                    break;
                case "clear" :
                    if(teamMenSenderId == conf.user.steamid) {
                        dist.clear();
                        rustplus.sendTeamMessage("GlaDOS: Todos los dispositivos borrados");
                    }
                    break;
                case "note" :
                    rnote.saveToFile(teamMen.replace(':rnote',""));
                    rustplus.sendTeamMessage("GlaDOS: nota guardada pero aun no se puede leer :D");
                    break; 
                case "craftcost" : 
                    rcraftcost.rcraftcost(rustplus,teamMenSender,teamMen);
                    break ;
                case "coinflip" : 
                    var results = ["Loss","Win"]
                    rustplus.sendTeamMessage("GlaDOS: "+results[Math.floor(Math.random()*results.length)]);
                    break; 
                case "ecost" :
                    rustplus.sendTeamMessage("GlaDOS: hey no tan rapido celebrito");
                    break;        
                case "help" :
                    rustplus.sendTeamMessage("GlaDOS: :off/on DISNAME , :time, :status, :map, :save DISNAME, :note, :coinflip, :craftcost item quantity, :ecost item");
                    break;           
                default :
                    rustplus.sendTeamMessage("GlaDOS: '"+command+"' no es un comando reconocido :help para ver lista de comandos aceptados ");   
                    break; 
             }
            //if (teamMen.startsWith(':off') || teamMen.startsWith(':on')) {
            //    
            //}
            //if (teamMen.startsWith(':time')) {
            //    rtime(rustplus,teamMenSender);
            //   
            //}
            //if (teamMen.startsWith(':status')) {
            //    rstatus(rustplus,teamMenSender);
            //   
            //}
            //if (teamMen.startsWith(':map')) {
            //    rustplus.getMapMarkers((message) => {
            //        console.log(JSON.stringify(message.response));
            //    });
  //
            //}
            //if (teamMen.startsWith(':save')) {
            //    const listener = new NodePrefs({fileName: "config-s.js"});
            //    console.log(listener.keys()[0]);
            //    rustplus.sendTeamMessage("GlaDOS: Guardando "+teamMen.split(' ')[1]+" con id "+listener.keys()[0]);
            //    dist.set(teamMen.split(' ')[1],listener.keys()[0]);
            //}
            //if (teamMen.startsWith(':clear')) {
            //    
            //    if(teamMenSenderId == conf.user.steamid) {
            //        dist.clear();
            //        rustplus.sendTeamMessage("GlaDOS: Todos los dispositivos borrados");
            //    }
            //}
            
            
            

         }
        
    }


});

// connect to rust server
rustplus.connect();

// 21758503 switch 21694826