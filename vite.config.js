import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        chunkSizeWarningLimit: 1500, // 용량 경고 기준을 1.5MB로 상향
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'] // phaser 라이브러리만 별도 파일로 분리
                }
            }
        }
    }
});
