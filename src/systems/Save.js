/**
 * Stormhammer Save System
 * Manages localStorage persistence for progress, high scores, and audio settings.
 */
export class SaveSystem {
  static KEYS = {
    HIGHEST_REALM: 'stormhammer_highest_realm',
    BEST_SCORES: 'stormhammer_best_scores',
    MUTED: 'stormhammer_muted'
  };

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
