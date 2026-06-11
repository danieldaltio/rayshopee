"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeDocument = sanitizeDocument;
exports.isValidCpf = isValidCpf;
exports.isValidCnpj = isValidCnpj;
exports.validateDocument = validateDocument;
exports.formatCpf = formatCpf;
exports.formatCnpj = formatCnpj;
function sanitizeDocument(doc) {
    return (doc || '').replace(/\D/g, '');
}
function isValidCpf(cpf) {
    const cleaned = sanitizeDocument(cpf);
    if (cleaned.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(cleaned))
        return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10)
        remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9)))
        return false;
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10)
        remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10)))
        return false;
    return true;
}
function isValidCnpj(cnpj) {
    const cleaned = sanitizeDocument(cnpj);
    if (cleaned.length !== 14)
        return false;
    if (/^(\d)\1{13}$/.test(cleaned))
        return false;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleaned.charAt(12)))
        return false;
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleaned.charAt(13)))
        return false;
    return true;
}
function validateDocument(doc) {
    const cleaned = sanitizeDocument(doc);
    if (cleaned.length === 11) {
        return {
            valid: isValidCpf(cleaned),
            type: 'cpf',
            cleaned,
            formatted: formatCpf(cleaned),
        };
    }
    if (cleaned.length === 14) {
        return {
            valid: isValidCnpj(cleaned),
            type: 'cnpj',
            cleaned,
            formatted: formatCnpj(cleaned),
        };
    }
    return {
        valid: false,
        type: 'unknown',
        cleaned,
        formatted: cleaned,
    };
}
function formatCpf(cpf) {
    const c = sanitizeDocument(cpf);
    if (c.length !== 11)
        return c;
    return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}
function formatCnpj(cnpj) {
    const c = sanitizeDocument(cnpj);
    if (c.length !== 14)
        return c;
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}
//# sourceMappingURL=cpf-cnpj.validator.js.map