const conf = require('../config/config');



    function rcraftcost (rustplus,teamMenSender,teamMen) {  
        if (teamMen.split(" ")[1] != undefined && teamMen.split(" ")[2]) rcraftcostitem(rustplus,teamMenSender,teamMen.split(" ")[1],teamMen.split(" ")[2])
        else rcraftcostlist(rustplus)

    
    };

    function rcraftcostlist (rustplus) {
        rustplus.sendTeamMessage("GLaDOS: "+JSON.stringify(Object.keys(conf.craftCost)));
        rustplus.connect();

    }

    function rcraftcostitem  (rustplus,teamMenSender,request_explosiveitem, quantity) {  

        switch(request_explosiveitem) {
            case 'rocket' :
                var total_rocket_gunpowder = conf.craftCost.rocket.gunpowder*quantity;
                var total_rocket_explosive = conf.craftCost.rocket.explosive*quantity;
                var total_rocket_explosive_gunpowder = total_rocket_explosive*conf.craftCost.explosive.gunpowder;
                var total_rocket_explosive_sulfur = total_rocket_explosive * conf.craftCost.explosive.sulfur;
                var total_gunpowder = total_rocket_gunpowder+total_rocket_explosive_gunpowder;
                var total_gunpowder_cost = total_gunpowder * conf.craftCost.gunpowder.sulfur;
                var total_cost = total_gunpowder_cost + total_rocket_explosive_sulfur;
                rustplus.sendTeamMessage("GLaDOS total gunpowder: "+total_gunpowder+" total sulfur "+total_cost+ " proportions sulfur for gunpowder: "+total_gunpowder_cost+" sulfur for explosives: "+total_rocket_explosive_sulfur);
                break;
            case 'c4' :
                var total_c4_explosive = conf.craftCost.c4.explosive*quantity;
                var total_c4_explosive_gunpowder = total_c4_explosive*conf.craftCost.explosive.gunpowder;
                var total_c4_explosive_sulfur = total_c4_explosive * conf.craftCost.explosive.sulfur;
                var total_gunpowder_cost = total_c4_explosive_gunpowder * conf.craftCost.gunpowder.sulfur;
                var total_cost = total_gunpowder_cost + total_c4_explosive_sulfur;
                rustplus.sendTeamMessage("GLaDOS total gunpowder: "+total_c4_explosive_gunpowder+" total sulfur "+total_cost+ " proportions sulfur for gunpowder: "+total_gunpowder_cost+" sulfur for explosives: "+total_c4_explosive_sulfur);
                break;
            case 'satchel':
                var total_satchel_gunpowder = conf.craftCost.satchel.gunpowder *quantity;
                var total_gunpowder_cost = conf.craftCost.gunpowder.sulfur*total_satchel_gunpowder;
                rustplus.sendTeamMessage("GLaDOS total gunpowder: "+total_satchel_gunpowder+" total sulfur "+total_gunpowder_cost);
                break;
            case 'explosiveammo':
                var total_explosiveammo_gunpowder = conf.craftCost.explosiveammo.gunpowder * quantity;
                var total_explosiveammo_sulfur = conf.craftCost.explosiveammo.sulfur*quantity;
                var total_gunpowder_cost = total_explosiveammo_gunpowder * conf.craftCost.gunpowder.sulfur;
                var total_cost = total_gunpowder_cost + total_explosiveammo_sulfur;
                rustplus.sendTeamMessage("GLaDOS total gunpowder: "+total_explosiveammo_gunpowder+" total sulfur "+total_cost+ " proportions sulfur for gunpowder: "+total_gunpowder_cost+" sulfur for ammo: "+total_explosiveammo_sulfur);
                break;
            case 'highvelocityrocket':
                var total_highvelocityrocket_gunpowder = conf.craftCost.highvelocityrocket.gunpowder * quantity; 
                var total_gunpowder_cost = total_highvelocityrocket_gunpowder * conf.craftCost.gunpowder.sulfur;
                rustplus.sendTeamMessage("GLaDOS total gunpowder: "+total_highvelocityrocket_gunpowder+" total sulfur "+total_gunpowder_cost);
                break;
            default : 
                rustplus.sendTeamMessage("GLaDOS explosivo desconocido");
                break;    
            
        }

       
            
    rustplus.connect();
    
    };
  
    
module.exports = {rcraftcost,rcraftcostitem};
    