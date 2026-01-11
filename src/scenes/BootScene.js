import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // 투명 배경 작업된 'wizard.png' 로드
        // 프레임 크기는 32로 설정 (실제 이미지에 맞게 추후 조정 가능)
        this.load.spritesheet('player', 'assets/student.png', {
            frameWidth: 64, frameHeight: 64
        });

        // 새(Bird) 스프라이트 로드 (64x64, 2x2)
        this.load.spritesheet('bird', 'assets/bird.png', {
            frameWidth: 64, frameHeight: 64
        });

        // 나무 이미지 로드
        this.load.image('tree', 'assets/tree.png');

        // 까마귀 스프라이트 로드 (64x64)
        this.load.spritesheet('crow', 'assets/kamagi.png', {
            frameWidth: 64, frameHeight: 64
        });

        // 배 이미지 로드
        this.load.image('pear', 'assets/pear.png');

        // 뱀 스프라이트 로드 (64x64, 표정 변화)
        this.load.spritesheet('snake', 'assets/snake.png', {
            frameWidth: 64, frameHeight: 64
        });
        // 황소 스프라이트 (Level 3)
        this.load.spritesheet('cow', 'assets/cow.png', {
            frameWidth: 64, frameHeight: 64
        });

        // 깃털 이미지 로드
        this.load.image('feather', 'assets/feather.png');

        // 덤불(나뭇잎) 이미지 로드
        this.load.image('leaves', 'assets/leaves.png');
        this.load.image('ui_box', 'assets/ui_box.png'); // New Dialogue Texture
    }

    create() {
        // 이미지 전처리 로직 제거 (이미 투명 배경임)
        // 바로 게임 시작
        this.scene.start('Level1');
    }
}
