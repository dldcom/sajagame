import BaseScene from './BaseScene.js';

export default class EndingScene extends BaseScene {
    constructor() {
        super('EndingScene');
    }

    create() {
        // 배경색 설정 (어두운 파란색 계열)
        this.cameras.main.setBackgroundColor('#2c3e50');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 축하 메시지
        this.add.text(width / 2, height / 2 - 50, 'CONGRATULATIONS!', {
            fontFamily: 'Jua',
            fontSize: '48px',
            color: '#f1c40f',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, '모든 시련을 극복하고 지혜를 얻으셨습니다.', {
            fontFamily: 'Jua',
            fontSize: '24px',
            color: '#ecf0f1'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 60, '(전화위복: 화가 바뀌어 오히려 복이 된다)', {
            fontFamily: 'Jua',
            fontSize: '18px',
            color: '#bdc3c7'
        }).setOrigin(0.5);

        // 재시작 안내 (깜빡임 효과)
        const restartText = this.add.text(width / 2, height - 100, 'Press SPACE to Restart', {
            fontFamily: 'Jua',
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restartText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 스페이스바 입력 시 Level1으로 이동
        this.input.keyboard.once('keydown-SPACE', () => {
            // 게임 상태 초기화 등이 필요하다면 여기서 처리
            this.scene.start('Level1');
        });
    }
}
