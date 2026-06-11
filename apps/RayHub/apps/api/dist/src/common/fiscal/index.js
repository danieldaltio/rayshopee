"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICMS_ALIQUOTA_INTERNA = exports.getAliquotaInterestadual = exports.calculateTaxes = exports.parseRegimeTributario = exports.selectCst = exports.determineCfopVenda = exports.determineCfop = void 0;
var cfop_router_1 = require("./cfop-router");
Object.defineProperty(exports, "determineCfop", { enumerable: true, get: function () { return cfop_router_1.determineCfop; } });
Object.defineProperty(exports, "determineCfopVenda", { enumerable: true, get: function () { return cfop_router_1.determineCfopVenda; } });
var cst_selector_1 = require("./cst-selector");
Object.defineProperty(exports, "selectCst", { enumerable: true, get: function () { return cst_selector_1.selectCst; } });
Object.defineProperty(exports, "parseRegimeTributario", { enumerable: true, get: function () { return cst_selector_1.parseRegimeTributario; } });
var tax_calculator_1 = require("./tax-calculator");
Object.defineProperty(exports, "calculateTaxes", { enumerable: true, get: function () { return tax_calculator_1.calculateTaxes; } });
Object.defineProperty(exports, "getAliquotaInterestadual", { enumerable: true, get: function () { return tax_calculator_1.getAliquotaInterestadual; } });
Object.defineProperty(exports, "ICMS_ALIQUOTA_INTERNA", { enumerable: true, get: function () { return tax_calculator_1.ICMS_ALIQUOTA_INTERNA; } });
//# sourceMappingURL=index.js.map