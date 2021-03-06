var TriggerHelper = require('./lib/TriggerHelper.js');
var connectionHelper = require('./lib/ConnectionHelper.js');
var help = require('./lib/Help.js');
var messageHelper = require('./lib/MessageHelper.js');

help.setHelpCategory(
  'roulette',
  'game of russian roulette',
  '/roulette - play one round of russian roulette\n' +
  '/roulette spin - spins the barrel\n' +
  '/roulette stats - display the game scores'
);

var Roulette = function (robot) {
  var trigger = new TriggerHelper('roulette');
  var shot;
  var lastPerson;

  var spinBarrel = function () {
    shot = Math.floor(Math.random() * 6);
  }

  var pullTrigger = function (person) {
    if (person == lastPerson) {
      return;
    }

    lastPerson = person;

    if (shot == 0) {
      spinBarrel();
      lastPerson = null;
      return true;
    } else {
      shot--;
      return false;
    }
  }

  spinBarrel();

  var addHit = function (person) {
    var connection = connectionHelper.getConnection();

    connection.query('SELECT * FROM roulette WHERE user = ?', [person], function (err, rows) {
      if (rows != undefined && rows.length > 0) {
        connection.query(
          'UPDATE roulette SET tries = tries+1, deaths = deaths+1 WHERE user = ?',
          [person],
          function (err) {}
        );
      } else {
        connection.query('INSERT INTO roulette (user, tries, deaths) VALUES (?, 1, 1)', [person], function (err) {});
      }

    });
  }

  var addMiss = function (person) {
    var connection = connectionHelper.getConnection();

    connection.query('SELECT * FROM roulette WHERE user = ?', [person], function (err, rows) {
      if (rows != undefined && rows.length > 0) {
        connection.query('UPDATE roulette SET tries = tries+1 WHERE user=(?)', [person], function (err) {});
      } else {
        connection.query('INSERT INTO roulette (user, tries, deaths) VALUES (?, 1, 0)', [person], function (err) {});
      }

    });
  }

  var getStats = function (msg) {
    var connection = connectionHelper.getConnection();
    var stats = [];
    var survival_rate;

    connection.query('SELECT * FROM roulette ORDER BY deaths/tries ASC', function(err, rows) {
      if (err) {
        msg.reply('Something broke');
      }

      var result = 'Roulette statistics: \n';

      rows.forEach(function (row) {
        survival_rate = (1 - parseFloat(row.deaths) / parseFloat(row.tries)) * 100;

        result +=
          row.user + ' - ' +
          'Tries: ' + row.tries + ' - ' +
          'Deaths: ' + row.deaths + ' - ' +
          'Survival rate: ' + survival_rate.toFixed(2) + '%\n';
      });

      msg.reply(result);
    });

    return stats;
  }

  var getDoubleTryMessage = function (msg) {
    var messages = [
      ', you have so much to live for, don\'t throw your life away',
      ', are you suicidal ?',
      ', you should not die like that'
    ];

    msg.reply(messages[Math.floor(Math.random() * messages.length)]);
  }

  var getMissedMessage = function (msg) {
    var messages = [
      '%name% will die tomorrow.',
      '%name% still lives... for now.',
      '%name% fails everything, even suicide.'
    ];

    msg.emote(' - *click* - ' + messages[Math.floor(Math.random() * messages.length)].replace('%name%', msg.message.user.name));
  }

  var getShotMessage = function (msg) {
    var messages = [
      '%name%\'s brain is splattered on the opposite wall.',
      '%name% is DEAD.',
      '%name%, you LOSE.',
      '%name% died in vain.',
      '%name% is just one more person to die in this stupid game.'
    ];

    msg.emote(' - *BANG* - ' + messages[Math.floor(Math.random() * messages.length)].replace('%name%', msg.message.user.name));
  }

  robot.hear(trigger.getTrigger(), function (msg) {

    var person = messageHelper.getPerson(msg);

    var result = pullTrigger(person);
    if (result === true) {
      addHit(person);
      getShotMessage(msg);
    } else if (result === undefined) {
      getDoubleTryMessage(msg);
    } else if (result === false) {
      addMiss(person);
      getMissedMessage(msg);
    }
  });

  robot.hear(trigger.getTrigger('spin'), function (msg) {
    spinBarrel();
    msg.emote(' - *spins*');
  });

  robot.hear(trigger.getTrigger('stats'), function (msg) {
    getStats(msg);
  });
};

module.exports = Roulette;
