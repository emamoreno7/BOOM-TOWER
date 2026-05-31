export class XPCurve {
  private baseXP: number;
  private exponent: number;

  constructor(baseXP = 100, exponent = 1.45) {
    this.baseXP = baseXP;
    this.exponent = exponent;
  }

  xpForLevel(level: number): number {
    return Math.floor(this.baseXP * Math.pow(level, this.exponent));
  }

  totalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  }

  levelFromXP(totalXP: number): { level: number; xpInLevel: number; xpForNext: number } {
    let level = 1;
    let remaining = totalXP;

    while (true) {
      const needed = this.xpForLevel(level);
      if (remaining < needed) break;
      remaining -= needed;
      level++;
    }

    return {
      level,
      xpInLevel: remaining,
      xpForNext: this.xpForLevel(level),
    };
  }
}
