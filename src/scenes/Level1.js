import BaseScene from './BaseScene.js';

// --- 게임 설정 상수 (CONFIG) ---
const CONFIG = {
    PLAYER_SPEED: 300,
    THROW_SPEED: 500,
    BIRD_HIT_RADIUS: 45,
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    COLORS: {
        PLAYER: 0x3498db,
        DOOR_CLOSED: 0x7f8c8d,
        DOOR_OPEN: 0x2ecc71,
        GRID_BASE: 0x2c3e50,
        GRID_ALT: 0x34495e,
        STONE: 0xecf0f1,
        BIRD1: 0xe74c3c,
        BIRD2: 0xe67e22
    }
};

export default class Level1 extends BaseScene {
    constructor() {
        super('Level1');
        this.gameState = 'DIALOGUE';
        // this.isDialogueInitialized = false; // Handled by BaseScene
        // this.dialogueIndex = 0; // Handled by BaseScene

        this.dialogueData = [
            { name: '주인공', text: '아... 여긴 어디지...?' },
            { name: '새들', text: '여기는 못 지나간다! 일석이조의 지혜가 없다면...' }
        ];

        this.quizOptions = [
            { text: '1. 일석이조', isCorrect: true },
            { text: '2. 전화위복', isCorrect: false },
            { text: '3. 일희일비', isCorrect: false },
            { text: '4. 석고대죄', isCorrect: false }
        ];
        this.currentQuizSelection = 0;
    }

    create() {
        super.create(); // Initialize UI elements and common controls from BaseScene

        // --- Bird Animations ---
        if (!this.anims.exists('fly-left')) {
            this.anims.create({
                key: 'fly-left',
                frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 1 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'fly-right',
                frames: this.anims.generateFrameNumbers('bird', { start: 2, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // --- Room Setup ---
        this.createRoom();

        // --- Door (Exit) ---
        this.door = this.add.rectangle(400, 40, 120, 40, CONFIG.COLORS.DOOR_CLOSED);
        this.physics.add.existing(this.door, true);

        this.add.text(400, 40, 'EXIT', {
            fontFamily: 'Jua', fontSize: '16px', color: '#000'
        }).setOrigin(0.5);

        // --- Birds (Factory Pattern) ---
        this.birds = this.physics.add.group();
        this.createBird(200, 250, 200);   // Bird 1
        this.createBird(600, 250, -200);  // Bird 2

        // --- Player ---
        this.createPlayer(400, 500, CONFIG.COLORS.PLAYER);

        // --- Stone ---
        this.stone = null;
        this.hasStone = true;
        this.isStoneThrown = false;

        // --- Controls ---
        this.setupControls(); // Setup common controls (cursors, WASD, space, enter)

        // --- DEV CHEAT ---
        // P키를 누르면 즉시 클리어 (테스트용)
        this.input.keyboard.on('keydown-P', () => {
            console.log('DEV: Skip Level');
            this.gameClear();
        });

        // --- DOM Elements (Specific to Quiz) ---
        this.uiQuizContainer = document.getElementById('quiz-container');
        this.uiQuizOptions = document.querySelectorAll('.option');

        // --- Initialize State ---
        this.gameState = 'DIALOGUE';
        this.currentDialogueSet = this.dialogueData; // Set dialogue data for BaseScene's handler
        this.uiDialogueBox.classList.remove('hidden'); // Ensure box is visible
        this.showDialogue(0); // Show first line immediately
    }

    createRoom() {
        this.physics.world.setBounds(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
        this.add.grid(400, 300, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 50, 50, CONFIG.COLORS.GRID_BASE)
            .setAltFillStyle(CONFIG.COLORS.GRID_ALT)
            .setAlpha(0.2);
    }

    // --- Helper: Bird Factory ---
    createBird(x, y, velocityX) {
        // 기존 Circle 대신 Sprite 사용
        const bird = this.physics.add.sprite(x, y, 'bird');
        this.birds.add(bird);

        bird.setDisplaySize(64, 64); // 적절한 크기로 조정
        bird.body.setSize(40, 40); // 히트박스 조정 (몸통)

        bird.body.setVelocityX(velocityX);
        bird.body.setBounce(1, 1);
        bird.body.setCollideWorldBounds(true);

        // 방향에 따른 애니메이션 재생
        if (velocityX < 0) {
            bird.anims.play('fly-left', true);
        } else {
            bird.anims.play('fly-right', true);
        }

        return bird;
    }

    update() {
        // BaseScene handles initial dialogue display via this.isDialogueInitialized removal

        if (this.gameState === 'DIALOGUE') {
            this.handleDialogueInput(); // Inherited from BaseScene
            this.player.body.setVelocity(0);
            return;
        }

        if (this.gameState === 'QUIZ') {
            this.handleQuizInput();
            this.player.body.setVelocity(0);
            return;
        }

        if (this.gameState === 'PLAYING' || this.gameState === 'DOOR_OPEN') {
            this.handlePlayerMovement(CONFIG.PLAYER_SPEED); // Inherited from BaseScene

            if (this.stone) {
                if (this.stone.y < 0 || this.stone.y > CONFIG.GAME_HEIGHT ||
                    this.stone.x < 0 || this.stone.x > CONFIG.GAME_WIDTH) {
                    this.resetStone();
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.throwStone();
            }

            if (this.gameState === 'DOOR_OPEN') {
                this.physics.overlap(this.player, this.door, () => {
                    this.startQuiz();
                });
            }

            // --- Bird Animation Update (매 프레임 방향 체크) ---
            this.birds.children.iterate((bird) => {
                if (bird && bird.body) {
                    if (bird.body.velocity.x < 0) {
                        bird.anims.play('fly-left', true);
                    } else if (bird.body.velocity.x > 0) {
                        bird.anims.play('fly-right', true);
                    }
                }
            });
        }
    }

    // showDialogue is inherited from BaseScene
    // handleDialogueInput is inherited from BaseScene
    // endDialogue is inherited from BaseScene
    // handlePlayerMovement is inherited from BaseScene

    throwStone() {
        if (this.gameState !== 'PLAYING' && this.gameState !== 'DOOR_OPEN') return;
        if (!this.hasStone || this.isStoneThrown) return;

        this.hasStone = false;
        this.isStoneThrown = true;

        this.stone = this.add.circle(this.player.x, this.player.y, 8, CONFIG.COLORS.STONE);
        this.physics.add.existing(this.stone);

        this.stone.body.setVelocity(this.lastDirection.x * CONFIG.THROW_SPEED, this.lastDirection.y * CONFIG.THROW_SPEED);

        this.physics.add.overlap(this.stone, this.birds, this.hitBird, null, this);
    }

    hitBird(stone, bird) {
        const birdsArray = this.birds.getChildren();
        let hitCount = 0;

        birdsArray.forEach(b => {
            if (Phaser.Math.Distance.Between(stone.x, stone.y, b.x, b.y) < CONFIG.BIRD_HIT_RADIUS) {
                hitCount++;
            }
        });

        if (hitCount >= 2) {
            this.missionSuccess();
        } else {
            this.cameras.main.shake(100, 0.005);
            this.resetStone();
        }
    }

    resetStone() {
        if (this.stone) this.stone.destroy();
        this.stone = null;
        this.hasStone = true;
        this.isStoneThrown = false;
    }

    missionSuccess() {
        if (this.stone) this.stone.destroy();
        this.birds.clear(true, true);

        this.gameState = 'DOOR_OPEN';

        this.door.setFillStyle(CONFIG.COLORS.DOOR_OPEN);

        const hint = this.add.text(400, 300, '문이 열렸다! 위쪽 출구로 이동하세요!', {
            fontFamily: 'Jua', fontSize: '24px', color: '#f1c40f'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: hint,
            alpha: 0,
            duration: 2000,
            delay: 1000
        });
    }

    startQuiz() {
        if (this.gameState === 'QUIZ') return;
        this.gameState = 'QUIZ';

        this.uiQuizContainer.classList.remove('hidden');
        this.currentQuizSelection = 0;
        this.updateQuizUI();

        this.physics.pause();
    }

    handleQuizInput() {
        const total = this.quizOptions.length;

        // Modulo 연산을 이용한 순환 로직
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
            // (현재 - 1 + 전체개수) % 전체개수 => 음수 방지 및 순환
            this.currentQuizSelection = (this.currentQuizSelection - 1 + total) % total;
            this.updateQuizUI();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
            // (현재 + 1) % 전체개수 => 순환
            this.currentQuizSelection = (this.currentQuizSelection + 1) % total;
            this.updateQuizUI();
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.submitQuiz();
        }
    }

    updateQuizUI() {
        this.uiQuizOptions.forEach((el, idx) => {
            if (idx === this.currentQuizSelection) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }

    submitQuiz() {
        const isCorrect = this.quizOptions[this.currentQuizSelection].isCorrect;
        const selectedEl = this.uiQuizOptions[this.currentQuizSelection];

        if (isCorrect) {
            selectedEl.classList.add('correct');
            this.time.delayedCall(1000, () => {
                this.gameClear();
            });
        } else {
            selectedEl.classList.add('wrong');
            this.time.delayedCall(500, () => {
                selectedEl.classList.remove('wrong');
            });
        }
    }

    gameClear() {
        // 스테이지 클리어 알림 후 UI 숨기고 레벨 2로 이동
        if (this.uiQuizContainer) {
            this.uiQuizContainer.classList.add('hidden');
        }
        this.scene.start('Level2');
    }
}
