let rtime = (rustplus,teamMenSender) =>{   
    rustplus.getTime((message) => {
        var hnow = parseInt(JSON.stringify(message.response.time.time));
        var hsunset = parseInt(JSON.stringify(message.response.time.sunset));
        var hsunrise = parseInt(JSON.stringify(message.response.time.sunrise));
        var dayduration = (hsunset -hsunrise);
        var realtimeperminday = 50 / dayduration;
        var realtimeperminnight = 10 / (24-dayduration);
        console.log (hnow+" "+hsunset+" "+hsunrise+" "+dayduration+" "+realtimeperminday+" "+realtimeperminnight);
        if (hnow >= hsunrise && hnow <= hsunset) {
            
            var timetosunset = (hsunset - hnow) * realtimeperminday;
            rustplus.sendTeamMessage("GlaDOS: Quedan "+parseInt(timetosunset)+" minutos para anochecer, "+teamMenSender);            
        } else {
            if (hnow >= hsunset) {
                hsunrise += 24; 
                var timetosunset = (hsunrise - hnow) * realtimeperminnight;
                console.log ("-"+hnow+" "+hsunrise+" "+realtimeperminnight)
            } else  {
                var timetosunset = (hsunrise - hnow) * realtimeperminnight;
                console.log (hnow+" "+hsunrise+" "+realtimeperminnight)
            }                            
            rustplus.sendTeamMessage("GlaDOS: Quedan "+parseInt(timetosunset)+" minutos para amanecer, "+teamMenSender);                                                
        }
});


};

module.exports = rtime;

