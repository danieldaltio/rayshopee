export declare class FocusNfeService {
    private readonly apiUrl;
    private readonly token;
    private readonly allowMockOnError;
    constructor();
    private getHeaders;
    createNfe(order: any, company: any): Promise<any>;
    cancelNfe(ref: string, justificativa: string): Promise<any>;
    private pollNfeStatus;
    private buildFocusPayload;
}
