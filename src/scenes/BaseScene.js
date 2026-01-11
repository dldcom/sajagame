import Phaser from 'phaser';

export default class BaseScene extends Phaser.Scene {
    constructor(key) {
        super(key);
        this.gameState = 'PLAYING';
        this.dialogueData = [];
        this.dialogueIndex = 0;
        this.currentDialogueSet = null;
    }

    create() {
        // --- DOM Elements ---
        this.uiDialogueBox = document.getElementById('dialogue-box');
        this.uiSpeaker = document.getElementById('speaker-name');
        this.uiText = document.getElementById('dialogue-text');

        // --- Animations ---
        // (행: 0=Down, 1=Left, 2=Right, 3=Up) - 사용자 지정 프레임
        if (!this.anims.exists('walk-down')) {
            this.anims.create({
                key: 'walk-down',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'walk-left',
                frames: this.anims.generateFrameNumbers('player', { start: 8, end: 10 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'walk-right',
                frames: this.anims.generateFrameNumbers('player', { start: 5, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: 'walk-up',
                frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // --- DEV CHEAT ---
        this.input.keyboard.on('keydown-P', () => {
            console.log('DEV: Skip Level');
            this.gameClear();
        });
    }

    createPlayer(x, y) {
        // 기존 Circle 대신 Sprite 사용
        // this.player = this.add.circle(x, y, 15, color);

        this.player = this.physics.add.sprite(x, y, 'player', 1); // 1번 프레임(정면 대기)
        this.player.setDisplaySize(48, 48); // 게임에 맞는 크기로 조정
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(40, 64);
        this.player.body.setOffset(10, 0); // (256 - 196) / 2 = 30

        // 바라보는 방향 저장 (초기값: 위쪽)
        this.lastDirection = new Phaser.Math.Vector2(0, 1); // Down initially

        return this.player;
    }

    handlePlayerMovement(speed = 300) {
        if (!this.player) return;

        const direction = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left.isDown || this.aKey.isDown) direction.x -= 1;
        if (this.cursors.right.isDown || this.dKey.isDown) direction.x += 1;
        if (this.cursors.up.isDown || this.wKey.isDown) direction.y -= 1;
        if (this.cursors.down.isDown || this.sKey.isDown) direction.y += 1;

        if (direction.length() > 0) {
            direction.normalize();
            this.lastDirection.copy(direction);

            // Animation Play
            if (Math.abs(direction.x) > Math.abs(direction.y)) {
                if (direction.x < 0) this.player.anims.play('walk-left', true);
                else this.player.anims.play('walk-right', true);
            } else {
                if (direction.y < 0) this.player.anims.play('walk-up', true);
                else this.player.anims.play('walk-down', true);
            }
        } else {
            // Stop animation & Show Idle Frame
            this.player.anims.stop();
            // Optional: Set idle frame based on last direction
        }

        direction.scale(speed);
        this.player.body.setVelocity(direction.x, direction.y);
    }

    // --- Dialogue System ---
    showDialogue(index) {
        const dataSet = this.currentDialogueSet || this.dialogueData;

        if (index >= dataSet.length) {
            this.endDialogue();
            return;
        }
        const data = dataSet[index];

        if (this.uiDialogueBox) {
            this.uiDialogueBox.classList.remove('hidden');
            this.uiSpeaker.innerText = data.name;
            this.uiText.innerText = data.text;
        }
    }

    handleDialogueInput() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.dialogueIndex++;
            this.showDialogue(this.dialogueIndex);
        }
    }

    endDialogue() {
        this.gameState = 'PLAYING';
        if (this.uiDialogueBox) {
            this.uiDialogueBox.classList.add('hidden');
        }
    }

    // --- Toast / Alerts ---
    showToast(message) {
        const toast = this.add.text(400, 300, message, {
            fontFamily: 'MaplestoryOTFLight', fontSize: '24px', color: '#f1c40f',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);
        toast.setDepth(100); // Ensure it's on top

        this.tweens.add({
            targets: toast,
            y: 250,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => toast.destroy()
        });
    }

    gameClear() {
        // Override me
        console.log('Game Cleared');
    }
}
