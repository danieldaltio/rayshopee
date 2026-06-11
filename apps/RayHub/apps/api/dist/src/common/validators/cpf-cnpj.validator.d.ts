export declare function sanitizeDocument(doc: string): string;
export declare function isValidCpf(cpf: string): boolean;
export declare function isValidCnpj(cnpj: string): boolean;
export declare function validateDocument(doc: string): {
    valid: boolean;
    type: 'cpf' | 'cnpj' | 'unknown';
    cleaned: string;
    formatted: string;
};
export declare function formatCpf(cpf: string): string;
export declare function formatCnpj(cnpj: string): string;
