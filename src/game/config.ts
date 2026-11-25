import Phaser from 'phaser';
import { LobbyScene } from './scenes/LobbyScene';

export const createPhaserConfig = (containerId: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: containerId,
  backgroundColor: '#FFFFFF',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [LobbyScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
});
