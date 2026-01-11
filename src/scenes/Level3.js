import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import DialogueBox from '../ui/DialogueBox.js'; // 새로 만든 대화창 컴포넌트

const CONFIG = {
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    COLORS: {
        PLAYER: 0x3498db,
        DOOR_CLOSED: 0xc0392b,
        DOOR_OPEN: 0x2ecc71, // 초록색
        GRID_BASE: 0x95a5a6,
        GRID_ALT: 0x7f8c8d
    }
};

export default class Level3 extends BaseScene {
    constructor() {
        super('Level3');
    }

    create() {
        super.create(); // 기본 설정
        this.isQuizCleared = false; // 퀴즈 클리어 상태 초기화


        // --- 1. 배경 설정 ---
        this.createRoom();

        // --- 2. 출구 (Exit) ---
        this.door = this.add.rectangle(400, 40, 120, 40, CONFIG.COLORS.DOOR_CLOSED);
        this.physics.add.existing(this.door, true);
        this.add.text(400, 40, 'EXIT', { fontFamily: 'Jua', fontSize: '16px', color: '#000' }).setOrigin(0.5);

        // --- 3. 장애물 (바위) ---
        // 출구를 꽉 막고 있는 거대한 바위
        this.rock = this.add.rectangle(400, 120, 160, 80, 0x7f8c8d);
        this.physics.add.existing(this.rock, true); // Static (움직이지 않음)

        // --- 4. 플레이어 ---
        this.createPlayer(400, 500, CONFIG.COLORS.PLAYER);

        // --- 5. 황소 (Monster) ---
        // 애니메이션 생성
        if (!this.anims.exists('cow-down')) {
            this.anims.create({ key: 'cow-down', frames: this.anims.generateFrameNumbers('cow', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'cow-left', frames: this.anims.generateFrameNumbers('cow', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'cow-right', frames: this.anims.generateFrameNumbers('cow', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'cow-up', frames: this.anims.generateFrameNumbers('cow', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
        }

        // 처음엔 구석에 있다가 돌진
        this.bull = this.physics.add.sprite(100, 500, 'cow');
        this.bull.setDisplaySize(80, 80); // 크기 살짝 키움 (위압감)
        this.bull.body.setSize(40, 40); // 히트박스는 좁게
        this.bull.body.setOffset(12, 12);

        this.bull.body.setBounce(0.5);
        this.bull.body.setCollideWorldBounds(true);
        this.bullSpeed = 160; // 속도
        this.bull.play('cow-right'); // 초기 모션

        // --- 6. 대화창 (New DialogueBox) ---
        // 기존 DOM 대화창 숨기기
        if (this.uiDialogueBox) this.uiDialogueBox.classList.add('hidden');

        // 새 캔버스 대화창 생성 (화면 하단)
        this.dialogueBox = new DialogueBox(this, 400, 500);
        this.dialogueBox.setDepth(100); // 가장 위에 표시
        this.dialogueBox.setScrollFactor(0); // 카메라가 움직여도 UI는 고정

        // --- 7. 시나리오 데이터 ---
        this.introDialogue = [
            { speaker: '나', text: '커다란 바위가 앞을 막고 있어...' },
            { speaker: '나', text: '이걸 어떻게 뚫고 지나가지?' },
            { speaker: '???', text: '음매애애애-!!!' },
            { speaker: '나', text: '헉! 저기서 미친 황소가 달려온다!' },
            { speaker: '나', text: '조심해야겠어. 부딪히면 끝장이야.' }
        ];

        this.clearDialogue = [
            { speaker: '시스템', text: '쾅!!! (황소가 바위에 정통으로 박았다)' },
            { speaker: '나', text: '휴... 살았다...' },
            { speaker: '나', text: '어? 황소 덕분에 바위가 부서져서 길이 열렸네?' },
            { speaker: '나', text: '이것이 바로... 전화위복(轉禍爲福)?!' }
        ];

        this.quizDialogue = [
            { speaker: '문지기', text: '잠깐! 이곳을 지나가려면 암호를 대라.' },
            {
                speaker: '문지기',
                text: '방금 겪은 상황(황소의 위협이 오히려 길이 됨)을 뜻하는 사자성어는?',
                choices: [
                    { text: '자포자기 (Despair)', value: 'wrong' },
                    { text: '전화위복 (Blessing in Disguise)', value: 'correct' }
                ],
                onChoice: (index, selectedChoice) => {
                    if (selectedChoice.value === 'correct') {
                        this.isQuizCleared = true; // 정답 플래그 설정
                        return false; // 정답! 다음 대사(칭찬)로 진행
                    } else {
                        // 오답! 토스트 띄우고
                        this.showToast('틀렸다! 다시 생각하고 오거라.');
                        // 대화창을 강제로 닫거나, 실패 대사를 보여주고 종료
                        // 여기서는 return true로 진행을 막고, 대화 종료 처리를 위해 빈 배열로 start를 부르거나, 
                        // UX상 깔끔하게 재시도를 유도하기 위해 종료시킴.
                        this.dialogueBox.setVisible(false);
                        this.gameState = 'PLAYING';
                        this.physics.resume();

                        return true;
                    }
                }
            },
            { speaker: '문지기', text: '정답이다. 지나가도 좋다.' }
        ];

        // --- 8. 컨트롤 설정 ---
        this.setupControls();

        // --- 9. 충돌 로직 ---

        // 1) 황소 vs 플레이어 -> 게임 오버
        this.physics.add.overlap(this.player, this.bull, () => {
            if (this.gameState === 'PLAYING') {
                this.cameras.main.shake(200, 0.05);
                this.showToast('황소에게 받혔다! (R키로 재시작)');
                this.gameState = 'GAMEOVER';
                this.physics.pause();
                this.player.setTint(0xff0000); // 붉게 변함
            }
        });

        // 2) 황소 vs 바위 -> 클리어 (전화위복!)
        this.physics.add.collider(this.bull, this.rock, () => {
            this.handleBullHitRock();
        });

        // 3) 플레이어 vs 바위 -> 막힘
        this.physics.add.collider(this.player, this.rock);

        // 4) 출구 이동 (바위 파괴 후) - Collider로 변경
        this.physics.add.collider(this.player, this.door, () => {
            // 바위가 파괴되어 길이 열렸다면 퀴즈 시작
            if (this.isRockDestroyed) {
                this.startDialogueSequence(this.quizDialogue);
            } else {
                this.showToast('문이 잠겨있다. 바위가 길을 막고 있다.');
            }
        });

        // R키 재시작 (게임 오버일 때만)
        this.input.keyboard.on('keydown-R', () => {
            if (this.gameState === 'GAMEOVER') {
                this.scene.restart();
            }
        });

        // 게임 시작 시 대화 실행
        this.startDialogueSequence(this.introDialogue);
    }

    update() {
        // 1. 대화 중일 때의 로직 (새 시스템 적용)
        if (this.gameState === 'DIALOGUE') {
            this.player.body.setVelocity(0); // 플레이어 정지

            // 황소가 있다면 정지 (클리어 후엔 황소가 없을 수도 있음)
            if (this.bull && this.bull.body) {
                this.bull.body.setVelocity(0);
                if (this.bull.anims) this.bull.anims.stop(); // 멈춤
            }

            // 스페이스바/엔터 키 입력 처리
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                // 이제 매니저가 알아서 다 함 (다음 줄 넘기기 or 종료)
                this.dialogueBox.handleInput();
            }
            // 화살표 키로 선택지 이동
            this.dialogueBox.handleCursorInput(this.cursors);
            return;
        }

        // 2. 게임 플레이 중
        if (this.gameState === 'PLAYING') {
            this.handlePlayerMovement(CONFIG.PLAYER_SPEED); // 플레이어 이동

            // 황소 AI: 플레이어 추적 (대화 중 아닐 때만)
            if (this.bull && this.bull.active) {
                this.physics.moveToObject(this.bull, this.player, this.bullSpeed);

                // 방향에 따른 애니메이션 재생
                const v = this.bull.body.velocity;
                if (Math.abs(v.x) > Math.abs(v.y)) {
                    // 가로 이동이 더 큼
                    if (v.x > 0) this.bull.play('cow-right', true);
                    else this.bull.play('cow-left', true);
                } else {
                    // 세로 이동이 더 큼
                    if (v.y > 0) this.bull.play('cow-down', true);
                    else this.bull.play('cow-up', true);
                }
            }
        }

        // 부모 update는 BaseScene에 있는 내용 실행 (필요 없다면 지울 수 있음)
        // super.update(); 
    }

    // --- 커스텀 대화 메서드 ---
    startDialogueSequence(dialogueSet) {
        this.gameState = 'DIALOGUE';
        this.physics.pause();

        // 매니저에게 시나리오 전달 & 끝났을 때 할 일(Callback) 지정
        this.dialogueBox.start(dialogueSet, () => {
            this.handleDialogueComplete(dialogueSet);
        });
    }

    // 대화가 끝났을 때 호출되는 콜백
    handleDialogueComplete(finishedDialogueSet) {
        // 클리어 대화 끝난 후 처리
        if (finishedDialogueSet === this.clearDialogue) {
            this.isRockDestroyed = true;
            this.door.setFillStyle(CONFIG.COLORS.DOOR_OPEN);
            this.showToast('문이 열렸다! 탈출하자!');
        }

        // 퀴즈 대화(정답) 끝난 후 처리
        if (finishedDialogueSet === this.quizDialogue && this.isQuizCleared) {
            // 정답을 맞춰서 플래그가 true일 때만 엔딩으로 이동
            this.scene.start('EndingScene');
        }

        // 게임 재개
        // 게임 재개
        this.gameState = 'PLAYING';
        this.physics.resume();
    }

    // --- 기타 헬퍼 메서드 ---
    createRoom() {
        this.physics.world.setBounds(0, 0, 800, 600);
        this.add.rectangle(400, 300, 800, 600, CONFIG.COLORS.BACKGROUND); // 배경색이 없어서 검은색일 수 있음, 임시
        this.add.grid(400, 300, 800, 600, 50, 50, CONFIG.COLORS.GRID_BASE)
            .setAltFillStyle(CONFIG.COLORS.GRID_ALT)
            .setAlpha(0.2);
    }

    handleBullHitRock() {
        if (this.isRockDestroyed) return;

        // 돌 파괴 연출 💥
        this.rock.destroy();
        this.cameras.main.shake(500, 0.05); // 쾅!

        // 황소도 충격으로 기절/사라짐
        this.bull.destroy();

        // 클리어 대화 시작
        this.startDialogueSequence(this.clearDialogue);
    }
}
