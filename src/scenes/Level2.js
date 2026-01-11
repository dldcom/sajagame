import Phaser from 'phaser';
import BaseScene from './BaseScene.js';

// --- Level 2 Configuration ---
const CONFIG = {
    PLAYER_SPEED: 300,
    COLORS: {
        BACKGROUND: 0x27ae60, // Forest Green
        GRID: 0x2ecc71,
        PLAYER: 0x3498db,     // Blue
        DOOR_CLOSED: 0xc0392b,
        DOOR_OPEN: 0x2ecc71
    }
};

export default class Level2 extends BaseScene {
    constructor() {
        super('Level2');
    }

    create() {
        super.create(); // Initialize UI elements and common controls from BaseScene

        this.gameState = 'PLAYING';
        this.dialogueData = [];
        this.dialogueIndex = 0;
        this.currentDialogueSet = null;

        // Level 2 specific data
        this.quizOptions = [
            { text: '1. 오비이락', isCorrect: true },
            { text: '2. 과유불급', isCorrect: false },
            { text: '3. 동문서답', isCorrect: false },
            { text: '4. 우이독경', isCorrect: false }
        ];

        this.snakeDialogue = [
            { speaker: '뱀', text: '아야! 네 녀석이 배를 던졌지?!' },
            { speaker: '나', text: '아니야! 난 그냥 지나가던 중이었어!' },
            { speaker: '뱀', text: '거짓말 마! 내 머리에 혹 난 거 안 보여? 절대 못 지나간다!' }
        ];

        this.resolveDialogue = [
            { speaker: '나', text: '자, 이걸 봐. 까마귀 깃털이야.' },
            { speaker: '나', text: '까마귀가 날아오르면서 배를 건드린 거라고.' },
            { speaker: '뱀', text: '어? 진짜네... 까마귀 짓이었구나...' },
            { speaker: '뱀', text: '오해해서 미안하다. 네가 범인인 줄 알았어.' }
        ];

        this.introDialogue = [
            { text: '레벨 2: (Crow and Pear)', speaker: '나레이션' },
            { text: '음, 이곳은 분위기가 좀 다르군.', speaker: '나' }
        ];

        this.isCutscenePlayed = false;
        this.hasFeather = false;
        this.isLevelCleared = false;

        // --- Bird Animations (Remove if not used or keep for Crow) ---
        // Crow Animation
        if (!this.anims.exists('crow-fly')) {
            this.anims.create({
                key: 'crow-fly',
                frames: this.anims.generateFrameNumbers('crow', { start: 0, end: 3 }),
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

        // (Birds removed)

        // --- Tree & Pear ---
        // 위쪽 Bush(y=150)와 높이 맞춤
        this.tree = this.add.sprite(400, 150, 'tree')
            .setDisplaySize(128, 128);

        // Decorative pears
        const pearPositions = [
            { x: 380, y: 120 }, { x: 420, y: 130 }, { x: 390, y: 160 }
        ];
        pearPositions.forEach(p => {
            this.add.image(p.x, p.y, 'pear').setDisplaySize(18, 26);
        });

        // The specific falling pear (will fall to snake at y=300)
        this.pear = this.physics.add.sprite(400, 150, 'pear')
            .setDisplaySize(18, 26);
        this.pear.body.setAllowGravity(false);

        // --- Snake (NPC) ---
        // 화면 정중앙 (400, 300)
        this.snake = this.physics.add.sprite(400, 300, 'snake');
        this.snake.setDisplaySize(64, 64);
        this.snake.setFrame(0);
        this.snake.setImmovable(true);
        this.snake.body.allowGravity = false;

        this.snakeText = this.add.text(400, 260, 'Zzz...', {
            fontFamily: 'Jua', fontSize: '14px', color: '#fff'
        }).setOrigin(0.5);

        // Start Cutscene Trigger (Crow)
        this.isCutscenePlayed = false;

        // -- Crow (나무 위쪽)
        this.crow = this.add.sprite(430, 80, 'crow')
            .setDisplaySize(48, 48);

        // -- Feather
        this.feather = this.add.sprite(430, 50, 'feather')
            .setDisplaySize(26, 32);
        this.physics.add.existing(this.feather);
        //this.feather.setVisible(false); // visibility issue? check usage

        // -- Bushes (숨바꼭질 장소) 🌿
        this.bushes = [];
        const bushPositions = [
            { x: 100, y: 150 }, // 왼쪽 위
            { x: 700, y: 150 }, // 오른쪽 위
            { x: 100, y: 500 }, // 왼쪽 아래
            { x: 700, y: 500 }  // 오른쪽 아래
        ];

        bushPositions.forEach(pos => {
            const bush = this.physics.add.sprite(pos.x, pos.y, 'leaves')
                .setDisplaySize(64, 64)
                .setImmovable(true);
            bush.isChecked = false; // 플래그 초기화
            this.bushes.push(bush);
        });

        // 정답 덤불 랜덤 선택
        this.targetBush = Phaser.Utils.Array.GetRandom(this.bushes);

        // --- Dialogue Data (Search Results) ---
        this.emptyBushDialogue = [
            { name: 'system', text: '부스럭... 여기엔 아무것도 없다.' }
        ];
        this.foundFeatherDialogue = [
            { name: 'system', text: '부스럭... 찾았다! 까마귀 깃털!' }
        ];

        this.snakeApologyDialogue = [
            { speaker: 'Snake', text: '미안하다... 문을 통과해도 좋다.' }
        ];
        this.isSnakeResolved = false;

        // 3. Player
        this.createPlayer(400, 550, CONFIG.COLORS.PLAYER);

        // 4. Controls
        this.setupControls();

        // DEV CHEAT: P키 누르면 바로 Level 3로 이동
        this.input.keyboard.on('keydown-P', () => {
            console.log('Skipping to Level 3...');
            this.scene.start('Level3');
        });

        // 5. Physics Collider (덤불 조사 & 충돌) 🌿
        this.physics.add.collider(this.player, this.bushes, (player, bush) => {
            this.handleBushOverlap(player, bush);
        });

        // 6. UI Elements
        // (UI elements initialized in super.create)
        this.uiQuizContainer = document.getElementById('quiz-container');
        this.uiQuizOptions = document.querySelectorAll('.option');

        // 7. Overlaps & Triggers
        // Trigger cutscene when player moves up
        this.triggerZone = this.add.zone(400, 400, 800, 10);
        this.physics.add.existing(this.triggerZone);

        this.physics.add.overlap(this.player, this.triggerZone, () => {
            if (!this.isCutscenePlayed) {
                this.playCutscene();
            }
        });

        // Interaction with Snake
        this.physics.add.collider(this.player, this.snake, () => {
            if (this.gameState === 'PLAYING') {
                if (this.isSnakeResolved) {
                    // 이미 화해함 -> 사과 대사만 출력
                    this.currentDialogueSet = this.snakeApologyDialogue;
                    this.dialogueIndex = 0;
                    this.gameState = 'DIALOGUE';
                    this.uiDialogueBox.classList.remove('hidden');
                    this.showDialogue(0);
                } else if (this.hasFeather) {
                    this.startResolveDialogue();
                } else {
                    this.showSnakeWarning();
                }
            }
        });

        // Feather Pickup
        this.physics.add.overlap(this.player, this.feather, () => {
            if (this.feather.visible && !this.hasFeather) {
                this.hasFeather = true;
                this.feather.destroy();
                this.showToast('까마귀 깃털을 획득했다!');
            }
        });

        // Exit Door Trigger
        this.physics.add.overlap(this.player, this.door, () => {
            if (this.isLevelCleared) {
                this.scene.start('Level3');
            } else if (this.isSnakeResolved) {
                // 뱀 화해 후 -> 문지기 퀴즈 시작!
                this.startQuiz();
            } else {
                this.showToast('아직 나갈 수 없다. 뱀이 막고 있다.');
            }
        });

        // 7. Start Intro
        this.currentDialogueSet = this.introDialogue;
        this.gameState = 'DIALOGUE'; // 상태를 DIALOGUE로 변경해야 update에서 입력 처리가 됨
        this.uiDialogueBox.classList.remove('hidden'); // 대화창 보이기
        this.showDialogue(0);
    }

    createRoom() {
        this.physics.world.setBounds(0, 0, 800, 600);
        this.add.rectangle(400, 300, 800, 600, CONFIG.COLORS.BACKGROUND);
        this.add.grid(400, 300, 800, 600, 50, 50, 0x27ae60).setAltFillStyle(CONFIG.COLORS.GRID).setAlpha(0.3);
    }

    update() {
        if (this.gameState === 'DIALOGUE') {
            this.handleDialogueInput(); // Inherited
            this.player.body.setVelocity(0);
            return;
        }

        if (this.gameState === 'CUTSCENE') {
            this.player.body.setVelocity(0);
            return;
        }

        if (this.gameState === 'QUIZ') {
            this.handleQuizInput();
            return;
        }

        if (this.gameState === 'PLAYING' || this.gameState === 'DOOR_OPEN') {
            this.handlePlayerMovement(CONFIG.PLAYER_SPEED); // Inherited
        }

        super.update();
        if (this.snakeText && this.snake) {
            this.snakeText.setPosition(this.snake.x, this.snake.y - 40);
        }
    }

    playCutscene() {
        this.isCutscenePlayed = true;
        this.gameState = 'CUTSCENE';

        // 0. Crow starts flying animation
        if (this.crow && this.crow.anims) {
            this.crow.play('crow-fly');
        }

        // 1. Crow flies away
        this.tweens.add({
            targets: this.crow,
            x: 800,
            y: -100,
            duration: 2000,
            onStart: () => {
                // 1초 뒤에 깃털 떨어뜨리기 (비행 중간쯤)
                this.time.delayedCall(1000, () => {
                    this.feather.setVisible(true);
                    this.feather.setPosition(this.crow.x, this.crow.y); // 움직이는 까마귀 위치에서 시작

                    // 1단계: 바닥으로 뚝 떨어짐 👇
                    this.tweens.add({
                        targets: this.feather,
                        y: this.feather.y + 300, // 바닥으로 낙하
                        angle: 180,              // 떨어지며 회전
                        duration: 500,
                        ease: 'Bounce.out',
                        onComplete: () => {
                            // 2단계: 바닥에서 잠시 대기했다가... ⏳
                            // 3단계: 바람에 날려 사라짐 🌬️
                            this.tweens.add({
                                targets: this.feather,
                                delay: 500,              // 0.5초 대기
                                y: this.feather.y - 200, // 다시 하늘로 솟구침
                                angle: 720,              // 뱅글뱅글
                                alpha: 0,                // 투명해짐
                                duration: 1500,
                                ease: 'Cubic.out',
                                onComplete: () => {
                                    this.feather.setVisible(false);
                                    this.feather.setAlpha(1); // 복구
                                }
                            });
                        }
                    });
                });
            }
        });

        // 2. Pear falls (reaction)
        this.time.delayedCall(500, () => {
            this.pear.body.setAllowGravity(true);
            this.pear.body.setGravityY(300);
        });

        // 3. Pear hits Snake
        this.physics.add.overlap(this.pear, this.snake, () => {
            this.pear.destroy();
            this.snakeText.setText('!!');
            this.snake.setFrame(1); // 1. 깜짝 놀란 표정 😲
            this.cameras.main.shake(200, 0.01);

            this.time.delayedCall(1000, () => {
                this.snake.setFrame(2); // 2. 화난 표정 😡
                this.currentDialogueSet = this.snakeDialogue;
                this.dialogueIndex = 0;
                this.gameState = 'DIALOGUE';
                this.uiDialogueBox.classList.remove('hidden');
                this.showDialogue(0);
            });
        });
    }

    createBird(x, y, velocityX) {
        // 기존 Circle 대신 Sprite 사용
        const bird = this.physics.add.sprite(x, y, 'bird');
        this.birds.add(bird);

        bird.setDisplaySize(40, 40); // 적절한 크기로 조정
        bird.body.setSize(30, 20); // 히트박스 조정 (몸통)

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

    showSnakeWarning() {
        this.snakeText.setText('Hssss!');
        this.showToast('뱀이 길을 막고 있다. 화가 많이 난 것 같다.');
        this.cameras.main.shake(100, 0.01);
        // 플레이어를 살짝 밀쳐냄
        this.player.y += 20;
    }

    startResolveDialogue() {
        // 뱀 표정 변화: 화남(2) -> 미안함(3)
        this.snake.setFrame(3);
        this.snakeText.setText('...');

        this.currentDialogueSet = this.resolveDialogue;
        this.dialogueIndex = 0;
        this.gameState = 'DIALOGUE';
        this.uiDialogueBox.classList.remove('hidden');
        this.showDialogue(0);
    }

    endDialogue() {
        // 어떤 대화였는지 확인하기 위해 super 호출 전에 체크? 아니면 변수에 저장?
        // BaseScene 구현에 따라 다르지만, 보통 super.endDialogue() 후에도 currentDialogueSet이 남아있거나
        // 아니면 여기서 비교하고 super를 부르면 됨.

        const isResolution = (this.currentDialogueSet === this.resolveDialogue);
        super.endDialogue();

        if (isResolution) {
            this.createPassage();
        }
    }

    createPassage() {
        this.showToast('오해가 풀렸다! 이제 문을 통해 나갈 수 있을 것 같다.');
        this.isSnakeResolved = true;
        // 문 색깔이나 상태는 아직 안 바꿈 (퀴즈 풀어야 열림)
    }

    handleBushOverlap(player, bush) {
        // 대화 중이면 무시 (깃털 있어도 대화는 가능하게 변경)
        if (this.gameState === 'DIALOGUE') return;

        // 약간의 쿨타임/딜레이 (너무 민감하게 반응하지 않도록)
        if (bush.isChecked) return;

        // 1. 이미 깃털을 찾은 경우 -> 무조건 "아무것도 없다"
        if (this.hasFeather) {
            bush.isChecked = true;
            this.time.delayedCall(2000, () => { bush.isChecked = false; });

            this.currentDialogueSet = this.emptyBushDialogue;
            this.dialogueIndex = 0;
            this.gameState = 'DIALOGUE';
            this.uiDialogueBox.classList.remove('hidden');
            this.showDialogue(0);
            return;
        }

        // 2. 아직 못 찾은 경우 -> 정답 확인 시작
        if (bush === this.targetBush) {
            // 정답! 🎉
            this.hasFeather = true;
            this.currentDialogueSet = this.foundFeatherDialogue;
            this.dialogueIndex = 0;
            this.gameState = 'DIALOGUE';
            this.uiDialogueBox.classList.remove('hidden');
            this.showDialogue(0);

            // 깃털 획득 연출
            this.feather.setPosition(bush.x, bush.y - 40);
            this.feather.setVisible(true);
            this.feather.setAlpha(1);

            this.tweens.add({
                targets: this.feather,
                x: this.player.x,
                y: this.player.y,
                duration: 500,
                onComplete: () => {
                    this.feather.destroy();
                }
            });
        } else {
            // 꽝! 💨
            // 반복 메시지 방지 (잠깐 체크 표시)
            bush.isChecked = true;
            this.time.delayedCall(2000, () => { bush.isChecked = false; }); // 2초 뒤 다시 확인 가능

            this.currentDialogueSet = this.emptyBushDialogue;
            this.dialogueIndex = 0;
            this.gameState = 'DIALOGUE';
            this.uiDialogueBox.classList.remove('hidden');
            this.showDialogue(0);
        }
    }

    // --- Quiz Logic (Same as Level 1 for now) ---
    startQuiz() {
        if (this.gameState === 'QUIZ') return;
        this.gameState = 'QUIZ';

        // 퀴즈 내용(DOM) 업데이트
        const questionEl = document.querySelector('.quiz-question');
        const optionElements = document.querySelectorAll('.option');

        if (questionEl) {
            questionEl.innerHTML = 'Q. 까마귀 날자 배 떨어진다는 뜻으로,<br>공교롭게 일이 겹쳐 의심받는 상황을 이르는 말은?';
        }

        this.quizOptions.forEach((opt, index) => {
            if (optionElements[index]) {
                optionElements[index].innerText = opt.text;
                // 선택지 스타일 초기화 (혹시 이전 상태 남아있을까봐)
                optionElements[index].classList.remove('selected', 'correct', 'wrong');
            }
        });

        if (this.uiQuizContainer) {
            this.uiQuizContainer.classList.remove('hidden');
        }
        this.currentQuizSelection = 0;
        this.updateQuizUI();
        this.physics.pause();
    }

    handleQuizInput() {
        const total = this.quizOptions.length;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey)) {
            this.currentQuizSelection = (this.currentQuizSelection - 1 + total) % total;
            this.updateQuizUI();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.sKey)) {
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
                // 퀴즈 종료 처리
                if (this.uiQuizContainer) {
                    this.uiQuizContainer.classList.add('hidden');
                }
                this.physics.resume();
                this.gameState = 'PLAYING';

                // 오해 풀림 & 문 열림 (이제 진짜 나갈 수 있음)
                this.isLevelCleared = true;
                this.showToast('문이 열렸다! 탈출하자!');
                this.door.setFillStyle(CONFIG.COLORS.DOOR_OPEN);
            });
        } else {
            selectedEl.classList.add('wrong');
            this.time.delayedCall(500, () => {
                selectedEl.classList.remove('wrong');
            });
        }
    }
}
