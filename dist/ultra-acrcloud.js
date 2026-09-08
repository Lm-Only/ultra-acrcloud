import * as crypto from 'node:crypto';
import * as https from 'node:https';
export class ACRCloudRecognizer {
    host;
    accessKey;
    accessSecret;
    dataType;
    endpoint;
    signatureVersion;
    timeout;
    constructor(config) {
        this.host = config.host || 'identify-us-west-2.acrcloud.com';
        this.accessKey = config.accessKey;
        this.accessSecret = config.accessSecret;
        this.dataType = config.dataType || 'audio';
        this.endpoint = config.endpoint || '/v1/identify';
        this.signatureVersion = config.signatureVersion || '1';
        this.timeout = config.timeout || 10000;
    }
    buildStringToSign(method, uri, timestamp) {
        return [method, uri, this.accessKey, this.dataType, this.signatureVersion, timestamp].join('\n');
    }
    sign(stringToSign) {
        return crypto
            .createHmac('sha1', this.accessSecret)
            .update(Buffer.from(stringToSign, 'utf-8'))
            .digest('base64');
    }
    /**
     * Constrói o corpo da requisição diretamente em memória.
     * Operações nativas com Buffer são mais rápidas do que gerenciar streams iteráveis via 'form-data'.
     */
    buildMultipartBody(boundary, fields, fileBuffer) {
        const chunks = [];
        const crlf = '\r\n';
        for (const [key, value] of Object.entries(fields)) {
            chunks.push(Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${value}${crlf}`));
        }
        chunks.push(Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="sample"; filename="sample"${crlf}Content-Type: application/octet-stream${crlf}${crlf}`));
        chunks.push(fileBuffer);
        chunks.push(Buffer.from(`${crlf}--${boundary}--${crlf}`));
        return Buffer.concat(chunks);
    }
    identify(audioSample) {
        return new Promise((resolve, reject) => {
            if (!Buffer.isBuffer(audioSample) || audioSample.length === 0) {
                return reject(new Error('Invalid audio sample buffer provided.'));
            }
            const timestamp = Math.floor(Date.now() / 1000);
            const stringToSign = this.buildStringToSign('POST', this.endpoint, timestamp);
            const signature = this.sign(stringToSign);
            // Geração de entropia rápida para o boundary
            const boundary = `----ACRCloudBoundary${crypto.randomBytes(16).toString('hex')}`;
            const fields = {
                access_key: this.accessKey,
                data_type: this.dataType,
                signature_version: this.signatureVersion,
                signature: signature,
                sample_bytes: audioSample.length,
                timestamp: timestamp
            };
            const payload = this.buildMultipartBody(boundary, fields, audioSample);
            const options = {
                hostname: this.host,
                path: this.endpoint,
                method: 'POST',
                timeout: this.timeout,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': payload.length
                }
            };
            const req = https.request(options, (res) => {
                const responseChunks = [];
                res.on('data', (chunk) => responseChunks.push(chunk));
                res.on('end', () => {
                    const responseData = Buffer.concat(responseChunks).toString('utf-8');
                    try {
                        resolve(JSON.parse(responseData));
                    }
                    catch (e) {
                        reject(new Error(`JSON Parse Error. Raw response: ${responseData}`));
                    }
                });
            });
            req.on('error', (error) => reject(error));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('ACRCloud API request timed out.'));
            });
            req.write(payload);
            req.end();
        });
    }
}
