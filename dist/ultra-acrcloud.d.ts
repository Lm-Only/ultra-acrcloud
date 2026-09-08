export interface ACRCloudConfig {
    host?: string;
    accessKey: string;
    accessSecret: string;
    dataType?: string;
    endpoint?: string;
    signatureVersion?: string;
    timeout?: number;
}
export interface ACRCloudResponse {
    status: {
        msg: string;
        code: number;
        version: string;
    };
    metadata?: any;
    [key: string]: any;
}
export declare class ACRCloudRecognizer {
    private readonly host;
    private readonly accessKey;
    private readonly accessSecret;
    private readonly dataType;
    private readonly endpoint;
    private readonly signatureVersion;
    private readonly timeout;
    constructor(config: ACRCloudConfig);
    private buildStringToSign;
    private sign;
    /**
     * Constrói o corpo da requisição diretamente em memória.
     * Operações nativas com Buffer são mais rápidas do que gerenciar streams iteráveis via 'form-data'.
     */
    private buildMultipartBody;
    identify(audioSample: Buffer): Promise<ACRCloudResponse>;
}
//# sourceMappingURL=ultra-acrcloud.d.ts.map