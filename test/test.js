import { env } from 'process';
import * as fs from 'fs/promises';
import { ACRCloudRecognizer } from '../dist/ultra-acrcloud.js';

async function run() {
    const acr = new ACRCloudRecognizer({
        host: env.HOST,
        accessKey: env.ACCESS_KEY,
        accessSecret: env.ACCESS_SECRET
    });
	
    try {
        const audioBuffer = await fs.readFile('./test/audio.mp3');
        const result = await acr.identify(audioBuffer);

        if (result.status.code === 0) {
            const music = result.metadata?.music?.[0];
            console.log('Música identificada:', {
                titulo: music?.title,
                artista: music?.artists?.map((a) => a.name).join(', '),
                album: music?.album?.name,
                score: music?.score
            });
        } else {
            console.log(`Falha (${result.status.code}): ${result.status.msg}`);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

run();