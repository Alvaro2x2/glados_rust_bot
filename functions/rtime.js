/**
 * Constants for time calculations
 */
const TIME_CONSTANTS = {
    HOURS_IN_DAY: 24,
    REAL_MINUTES_DAY: 50, // Real minutes during daytime
    REAL_MINUTES_NIGHT: 10 // Real minutes during nighttime
};

/**
 * Handles time information requests from the server
 * @param {Object} rustplus - RustPlus instance
 * @param {string} sender - Command sender's name
 */
const handleTimeInfo = (rustplus, sender) => {
    rustplus.getTime((message) => {
        const timeInfo = calculateTimeInfo(message.response.time);
        sendTimeMessage(rustplus, timeInfo, sender);
    });
};

/**
 * Calculates time information based on server response
 * @param {Object} serverTime - Server time information
 * @returns {Object} Calculated time information
 */
const calculateTimeInfo = (serverTime) => {
    const currentHour = parseInt(serverTime.time);
    const sunsetHour = parseInt(serverTime.sunset);
    const sunriseHour = parseInt(serverTime.sunrise);

    const dayDuration = sunsetHour - sunriseHour;
    const realMinutesPerHourDay = TIME_CONSTANTS.REAL_MINUTES_DAY / dayDuration;
    const realMinutesPerHourNight = TIME_CONSTANTS.REAL_MINUTES_NIGHT / (TIME_CONSTANTS.HOURS_IN_DAY - dayDuration);

    console.log(
        `Time calculation: Current: ${currentHour}, ` +
        `Sunset: ${sunsetHour}, ` +
        `Sunrise: ${sunriseHour}, ` +
        `Day duration: ${dayDuration}, ` +
        `Minutes/hour (day): ${realMinutesPerHourDay}, ` +
        `Minutes/hour (night): ${realMinutesPerHourNight}`
    );

    const isDaytime = currentHour >= sunriseHour && currentHour <= sunsetHour;
    let timeUntilChange;
    let isUntilSunset;

    if (isDaytime) {
        timeUntilChange = (sunsetHour - currentHour) * realMinutesPerHourDay;
        isUntilSunset = true;
    } else {
        let adjustedSunrise = sunriseHour;
        if (currentHour >= sunsetHour) {
            adjustedSunrise += TIME_CONSTANTS.HOURS_IN_DAY;
        }
        timeUntilChange = (adjustedSunrise - currentHour) * realMinutesPerHourNight;
        isUntilSunset = false;

        console.log(
            `Night time calculation: Current: ${currentHour}, ` +
            `Adjusted sunrise: ${adjustedSunrise}, ` +
            `Minutes/hour: ${realMinutesPerHourNight}`
        );
    }

    return {
        timeUntilChange: parseInt(timeUntilChange),
        isUntilSunset
    };
};

/**
 * Sends formatted time message to team chat
 * @param {Object} rustplus - RustPlus instance
 * @param {Object} timeInfo - Calculated time information
 * @param {string} sender - Command sender's name
 */
const sendTimeMessage = (rustplus, timeInfo, sender) => {
    const message = timeInfo.isUntilSunset
        ? `GLaDOS: ${timeInfo.timeUntilChange} minutes until sunset, ${sender}`
        : `GLaDOS: ${timeInfo.timeUntilChange} minutes until sunrise, ${sender}`;

    rustplus.sendTeamMessage(message);
};

module.exports = handleTimeInfo;
