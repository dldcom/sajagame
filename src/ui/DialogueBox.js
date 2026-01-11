import Phaser from 'phaser';

export default class DialogueBox extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        // 1. 상태 변수
        this.currentState = 'HIDDEN'; // HIDDEN, TYPING, WAITING, CHOICE
        this.fullText = '';
        this.visibleText = '';
        this.typeTimer = null;
        this.typingSpeed = 50; // ms per char

        // 시퀀스 데이터
        this.dialogueList = [];
        this.currentLineIndex = 0;
        this.onComplete = null;

        // 2. 배경 (NineSlice) - 로드 실패 대비 Graphics 추가는 생략 (이미지 있으니)
        // 64x64 이미지를 700x150으로 늘림
        this.background = scene.add.nineslice(0, 0, 'ui_box', 0, 700, 150, 20, 20, 20, 20);

        // 3. 화자 이름 텍스트
        this.nameText = scene.add.text(-320, -50, '', {
            fontFamily: 'Jua',
            fontSize: '24px',
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // 4. 대사 내용 텍스트
        this.messageText = scene.add.text(-320, -10, '', {
            fontFamily: 'Jua',
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: 640 }
        }).setOrigin(0, 0);

        // 5. 다음 아이콘 (깜빡이는 화살표)
        this.nextIcon = scene.add.text(320, 50, '▼', {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(1, 1);

        scene.tweens.add({
            targets: this.nextIcon,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 6. 선택지 UI 컨테이너
        this.choiceContainer = scene.add.container(200, -80);
        this.choices = null;
        this.currentChoiceIndex = 0;
        this.onChoice = null;

        // 컨테이너에 담기
        this.add([this.background, this.nameText, this.messageText, this.nextIcon, this.choiceContainer]);

        // 씬에 추가 및 초기화
        scene.add.existing(this);
        this.setVisible(false);
    }

    // 대화 시퀀스 시작
    start(dialogueList, onComplete) {
        this.dialogueList = dialogueList;
        this.currentLineIndex = 0;
        this.onComplete = onComplete;

        this.setVisible(true);
        this.showLine(this.dialogueList[0]);
    }

    showLine(lineData) {
        this.currentState = 'TYPING';

        this.nameText.setText(lineData.speaker);
        this.fullText = lineData.text;

        // 선택지 데이터 확인
        this.choices = lineData.choices || null;
        this.onChoice = lineData.onChoice || null;

        this.visibleText = '';
        this.messageText.setText('');
        this.nextIcon.setVisible(false);
        this.choiceContainer.setVisible(false);

        if (this.typeTimer) this.typeTimer.remove();

        this.typeTimer = this.scene.time.addEvent({
            delay: this.typingSpeed,
            callback: this.typeNextChar,
            callbackScope: this,
            loop: true
        });
    }

    typeNextChar() {
        if (this.visibleText.length >= this.fullText.length) {
            this.finishTyping();
            return;
        }
        this.visibleText += this.fullText[this.visibleText.length];
        this.messageText.setText(this.visibleText);
    }

    finishTyping() {
        if (this.typeTimer) this.typeTimer.remove();
        this.messageText.setText(this.fullText);

        if (this.choices) {
            this.currentState = 'CHOICE';
            this.showChoices();
        } else {
            this.currentState = 'WAITING';
            this.nextIcon.setVisible(true);
        }
    }

    showChoices() {
        this.choiceContainer.removeAll(true);
        this.choiceContainer.setVisible(true);
        this.currentChoiceIndex = 0;

        // 배경
        const bgHeight = this.choices.length * 40 + 20;
        const bg = this.scene.add.rectangle(0, 0, 300, bgHeight, 0x000000, 0.8)
            .setStrokeStyle(2, 0xffffff);
        this.choiceContainer.add(bg);

        // 항목들
        this.choiceTexts = [];
        this.choices.forEach((choice, index) => {
            const yPos = -bgHeight / 2 + 30 + (index * 40);
            const text = this.scene.add.text(-130, yPos, choice.text, {
                fontFamily: 'Jua', fontSize: '20px', color: '#ffffff'
            });
            this.choiceContainer.add(text);
            this.choiceTexts.push(text);
        });

        this.updateChoiceHighlight();
    }

    updateChoiceHighlight() {
        this.choiceTexts.forEach((text, index) => {
            if (index === this.currentChoiceIndex) {
                text.setColor('#f1c40f');
                text.setText('▶ ' + this.choices[index].text);
            } else {
                text.setColor('#ffffff');   
                text.setText('  ' + this.choices[index].text);
            }
        });
    }

    // 외부 입력 (스페이스바)
    handleInput() {
        if (this.currentState === 'TYPING') {
            this.finishTyping();
        } else if (this.currentState === 'WAITING') {
            this.advance();
        } else if (this.currentState === 'CHOICE') {
            this.confirmChoice();
        }
    }

    // 외부 입력 (방향키)
    handleCursorInput(cursors) {
        if (this.currentState !== 'CHOICE') return;

        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            this.currentChoiceIndex = Math.max(0, this.currentChoiceIndex - 1);
            this.updateChoiceHighlight();
        } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
            this.currentChoiceIndex = Math.min(this.choices.length - 1, this.currentChoiceIndex + 1);
            this.updateChoiceHighlight();
        }
    }

    confirmChoice() {
        const selectedChoice = this.choices[this.currentChoiceIndex];
        this.choiceContainer.setVisible(false);
        this.currentState = 'WAITING';

        // 콜백 실행 (true 리턴 시 다음 대사로 자동 진행 안 함)
        let preventAdvance = false;
        if (this.onChoice) {
            preventAdvance = this.onChoice(this.currentChoiceIndex, selectedChoice);
        }

        if (!preventAdvance) {
            this.advance();
        }
    }

    advance() {
        this.currentLineIndex++;
        if (this.currentLineIndex < this.dialogueList.length) {
            this.showLine(this.dialogueList[this.currentLineIndex]);
        } else {
            this.close();
            if (this.onComplete) this.onComplete();
        }
    }

    close() {
        this.setVisible(false);
        this.currentState = 'HIDDEN';
    }
}
