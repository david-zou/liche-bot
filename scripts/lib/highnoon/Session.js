class Session {
  constructor(channelId, maxPlayers) {
    this.channelId = channelId;
    this.players = {};
    this.maxPlayers = maxPlayers;
    this.allShotsFired = false;
    this.countdownValue = Math.floor(Math.random() * 2500) + 2500; // Guarantees to never be zero
    this.timer = null;
    this.elapsed = 0;
  }

  playersNeeded() {
    return this.maxPlayers - this.players.length;
  }

  getCurrentPlayers() {
    return this.players;
  }

  getMaxPlayers() {
    return this.maxPlayers;
  }

  getCountdownValue() {
    return this.countdownValue;
  }

  sessionIsFull() {
    return this.players.length === this.maxPlayers;
  }

  isTimeToDraw() {
    return this.elapsed >= this.countdownValue;
  }
};

module.exports = Session;