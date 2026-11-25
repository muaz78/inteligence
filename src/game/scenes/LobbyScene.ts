import Phaser from 'phaser';
import { GameBridge } from '../GameBridge';

export class LobbyScene extends Phaser.Scene {
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private pins: Phaser.GameObjects.Container[] = [];
  private coordinateLines: Phaser.GameObjects.Graphics | null = null;
  private angleOffset = 0;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Draw background coordinates grid
    this.coordinateLines = this.add.graphics();
    this.drawRadarGrid(width, height);

    // Interactive Country Pins Data
    const cities = [
      { name: 'Tokyo 🇯🇵', x: width * 0.78, y: height * 0.38, code: 'JP', color: 0x3478F6 },
      { name: 'Paris 🇫🇷', x: width * 0.48, y: height * 0.32, code: 'FR', color: 0x8B5CF6 },
      { name: 'Rio 🇧🇷', x: width * 0.35, y: height * 0.72, code: 'BR', color: 0x29B765 },
      { name: 'Cairo 🇪🇬', x: width * 0.54, y: height * 0.44, code: 'EG', color: 0xFF9F43 },
      { name: 'Reykjavik 🇮🇸', x: width * 0.42, y: height * 0.22, code: 'IS', color: 0x06B6D4 },
    ];

    // Create interactive pin nodes
    cities.forEach((city) => {
      const container = this.add.container(city.x, city.y);

      // Outer pulsing ring
      const ring = this.add.circle(0, 0, 16, city.color, 0.2);
      this.tweens.add({
        targets: ring,
        scale: 1.6,
        alpha: 0,
        duration: 1800,
        repeat: -1,
        ease: 'Cubic.easeOut',
      });

      // Core Pin
      const pin = this.add.circle(0, 0, 8, city.color, 1);
      pin.setStrokeStyle(2, 0xffffff);

      // Label background
      const labelBg = this.add.rectangle(0, -22, 65, 18, 0xffffff, 0.95);
      labelBg.setStrokeStyle(1, 0xCBD5E1);

      // Label text
      const labelText = this.add.text(0, -22, city.name, {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '10px',
        color: '#1E293B',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([ring, pin, labelBg, labelText]);
      container.setSize(40, 40);
      container.setInteractive({ useHandCursor: true });

      // Interactive Click on Geography Node
      container.on('pointerdown', () => {
        // Burst animation
        this.tweens.add({
          targets: container,
          scale: 1.25,
          yoyo: true,
          duration: 150,
        });

        // Trigger bridge event
        GameBridge.emit('countryPinClicked', city);
      });

      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.1,
          duration: 150,
        });
      });

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1.0,
          duration: 150,
        });
      });

      this.pins.push(container);
    });

    // Subtitle badge inside canvas
    this.add.text(16, 16, '⚡ PHASER 3 ENGINE • GEOGRAPHY RADAR ARENA', {
      fontFamily: '"Teko", sans-serif',
      fontSize: '14px',
      color: '#3478F6',
      fontStyle: 'bold',
    });

    this.add.text(16, 32, 'Click any coordinate node to test interactive map ping', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '10px',
      color: '#64748B',
    });
  }

  private drawRadarGrid(width: number, height: number) {
    if (!this.coordinateLines) return;
    this.coordinateLines.clear();

    // Subtle coordinate lines
    this.coordinateLines.lineStyle(1, 0xE2E8F0, 0.7);

    const step = 40;
    for (let x = 0; x < width; x += step) {
      this.coordinateLines.moveTo(x, 0);
      this.coordinateLines.lineTo(x, height);
    }
    for (let y = 0; y < height; y += step) {
      this.coordinateLines.moveTo(0, y);
      this.coordinateLines.lineTo(width, y);
    }
    this.coordinateLines.strokePath();

    // Central circular target range
    const centerX = width * 0.55;
    const centerY = height * 0.5;
    this.coordinateLines.lineStyle(1.5, 0x3478F6, 0.25);
    this.coordinateLines.strokeCircle(centerX, centerY, 80);
    this.coordinateLines.strokeCircle(centerX, centerY, 140);
    this.coordinateLines.strokeCircle(centerX, centerY, 200);
  }

  update() {
    this.angleOffset += 0.01;
  }
}
