import Phaser from 'phaser';
import Level1 from './scenes/Level1.js';
import './style.css';
import BootScene from './scenes/BootScene.js';
import Level2 from './scenes/Level2.js';
import Level3 from './scenes/Level3.js';
import EndingScene from './scenes/EndingScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    parent: 'game-container',
    backgroundColor: '#34495e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down game, no gravity
            debug: false
        }
    },
    scene: [BootScene, Level1, Level2, Level3, EndingScene]
};

const game = new Phaser.Game(config);
