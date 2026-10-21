/**
 * Stormhammer Save System
 * Manages localStorage persistence for progress, high scores, and audio settings.
 */
export class SaveSystem {
  static KEYS = {
    HIGHEST_REALM: 'stormhammer_highest_realm',
    BEST_SCORES: 'stormhammer_best_scores',
    MUTED: 'stormhammer_muted',
    UPGRADES: 'stormhammer_upgrades',
    STARS: 'stormhammer_stars',
    BEST_TIMES: 'stormhammer_best_times',
    COINS: 'stormhammer_total_coins'
  };

  static getUpgrades() {
    try {
      const raw = localStorage.getItem(this.KEYS.UPGRADES);
      return raw ? JSON.parse(raw) : {
        maxHp: 0,        // +1 max heart
        hammerDamage: 0, // +1 damage
        throwRange: 0,   // +60px throw range
        stormDuration: 0 // +4s storm duration
      };
    } catch (e) {
      return { maxHp: 0, hammerDamage: 0, throwRange: 0, stormDuration: 0 };
    }
  }

  static setUpgrades(upgrades) {
    try {
      localStorage.setItem(this.KEYS.UPGRADES, JSON.stringify(upgrades));
    } catch (e) {}
  }

  static getTotalCoins() {
    try {
      const val = localStorage.getItem(this.KEYS.COINS);
      return val ? parseInt(val, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  static addTotalCoins(amount) {
    try {
      const current = this.getTotalCoins();
      const next = Math.max(0, current + amount);
      localStorage.setItem(this.KEYS.COINS, next.toString());
      return next;
    } catch (e) {
      return 0;
    }
  }

  static getRealmStars(realm) {
    try {
      const raw = localStorage.getItem(this.KEYS.STARS);
      const allStars = raw ? JSON.parse(raw) : {};
      return allStars[realm] || { stars: 0, foundKey: false, allSecrets: false, noDeaths: false };
    } catch (e) {
      return { stars: 0, foundKey: false, allSecrets: false, noDeaths: false };
    }
  }

  static setRealmStars(realm, starData) {
    try {
      const raw = localStorage.getItem(this.KEYS.STARS);
      const allStars = raw ? JSON.parse(raw) : {};
      const current = allStars[realm] || { stars: 0 };
      const starsEarned = (starData.foundKey ? 1 : 0) + (starData.allSecrets ? 1 : 0) + (starData.noDeaths ? 1 : 0);
      if (starsEarned >= (current.stars || 0)) {
        allStars[realm] = { ...starData, stars: starsEarned };
        localStorage.setItem(this.KEYS.STARS, JSON.stringify(allStars));
      }
    } catch (e) {}
  }

  static getBestTime(realm) {
    try {
      const raw = localStorage.getItem(this.KEYS.BEST_TIMES);
      const times = raw ? JSON.parse(raw) : {};
      return times[realm] || 0;
    } catch (e) {
      return 0;
    }
  }

  static recordTime(realm, seconds) {
    try {
      const raw = localStorage.getItem(this.KEYS.BEST_TIMES);
      const times = raw ? JSON.parse(raw) : {};
      if (!times[realm] || seconds < times[realm]) {
        times[realm] = seconds;
        localStorage.setItem(this.KEYS.BEST_TIMES, JSON.stringify(times));
      }
    } catch (e) {}
  }

  static getHighestRealm() {
    try {
      const val = localStorage.getItem(this.KEYS.HIGHEST_REALM);
      return val ? parseInt(val, 10) : 1;
    } catch (e) {
      return 1;
    }
  }

  static setHighestRealm(realm) {
    try {
      const current = this.getHighestRealm();
      if (realm > current) {
        localStorage.setItem(this.KEYS.HIGHEST_REALM, realm.toString());
      }
    } catch (e) {}
  }

  static getBestScore(realm) {
    try {
      const raw = localStorage.getItem(this.KEYS.BEST_SCORES);
      const scores = raw ? JSON.parse(raw) : {};
      return scores[realm] || 0;
    } catch (e) {
      return 0;
    }
  }

  static setBestScore(realm, score) {
    try {
      const raw = localStorage.getItem(this.KEYS.BEST_SCORES);
      const scores = raw ? JSON.parse(raw) : {};
      if ((scores[realm] || 0) < score) {
        scores[realm] = score;
        localStorage.setItem(this.KEYS.BEST_SCORES, JSON.stringify(scores));
      }
    } catch (e) {}
  }

  static isMuted() {
    try {
      return localStorage.getItem(this.KEYS.MUTED) === 'true';
    } catch (e) {
      return false;
    }
  }

  static setMuted(muted) {
    try {
      localStorage.setItem(this.KEYS.MUTED, muted ? 'true' : 'false');
    } catch (e) {}
  }
}
