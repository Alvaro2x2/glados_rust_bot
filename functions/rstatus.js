const conf = require('../config/config');

    let rstatus = (rustplus,teamMenSender) =>{  
        console.log(conf.dispositive);
        console.log(conf.cupboard);
        //var dispositives = Object.keys(conf.dispositive);
        //var dis = dispositives.indexOf(mdispositive.split(" ",2)[1]);   
        //var dispositiveid = conf.dispositive[dispositives[dis]];
        
        for (var dis in conf.dispositive) {
            console.log("Comprobando estado de "+dis + " id " + conf.dispositive[dis]);
            rustplus.getEntityInfo(conf.dispositive[dis], (message) => {
                console.log("·2323")
                console.log("getEntityInfo result: " + JSON.stringify(message));
            });
        }

       
            
    rustplus.connect();
    
    };
    
module.exports = rstatus;
    