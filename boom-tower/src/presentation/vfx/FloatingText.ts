import Phaser from 'phaser';

export class FloatingText {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showScore(x: number, y: number, score: number): void {
    const text = this.scene.add.text(x, y, `+${score.toLocaleString()}`, {
      fontSize: '22px', fontFamily: 'Arial',
      color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: text,
      y: y - 60, alpha: 0,
      duration: 800, ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  showCombo(x: number, y: number, combo: number): void {
    const color = combo >= 25 ? '#ff4444' : combo >= 10 ? '#ffaa00' : '#ffd700';
    const text = this.scene.add.text(x, y, `COMBO x${combo}!`, {
      fontSize: '28px', fontFamily: 'Arial',
      color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.3, scaleY: 1.3,
      duration: 150, yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          y: y - 80, alpha: 0,
          duration: 600,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  showSpecial(x: number, y: number, label: string, color = '#ff6600'): void {
    const text = this.scene.add.text(x, y, label, {
      fontSize: '32px', fontFamily: 'Arial',
      color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.5, scaleY: 1.5, alpha: 0,
      duration: 800, ease: 'Back.easeOut',
      onComplete: () => text.destroy(),
    });
  }
}
