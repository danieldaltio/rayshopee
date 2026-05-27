'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/hooks/use-company';
import { useShopeeStatus, useShopeeAuthUrl } from '@/hooks/use-shopee';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  FileText,
  Link2,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Info,
} from 'lucide-react';

// ─── Schema ─────────────────────────────────────────────────────────────────

const companySchema = z.object({
  razao_social: z.string().min(2, 'Razão Social é obrigatória'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos numéricos'),
  ie: z.string().optional(),
  im: z.string().optional(),
  regime_tributario: z.string().optional(),
  endereco_cep: z.string().optional(),
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_uf: z.string().optional(),
  // NF-e
  nfe_serie: z.string().optional(),
  nfe_proximo_numero: z.coerce.number().int().min(1, 'Deve ser maior ou igual a 1').optional(),
  nfe_ambiente: z.string().optional(),
  nfe_provedor: z.string().optional(),
  // Classe de impostos
  imposto_calculo_tipo: z.string().optional(),
  cst_csosn_padrao: z.string().optional(),
  cst_pis_cofins: z.string().optional(),
  aliquota_simples: z.coerce.number().min(0).max(100).optional(),
  impostos_config: z.any().optional(),
  // Certificado A1
  certificado_digital_url: z.string().optional(),
  certificado_senha_hash: z.string().optional(),
  certificado_base64: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────

const CST_CSOSN_OPTIONS = [
  { value: '102', label: '102 — Tributada pelo Simples sem permissão de crédito' },
  { value: '400', label: '400 — Não tributada pelo Simples Nacional' },
  { value: '500', label: '500 — ICMS cobrado anteriormente por substituição tributária' },
  { value: '900', label: '900 — Outros (Simples Nacional)' },
  { value: '00',  label: '00 — Tributada integralmente (Regime Normal)' },
  { value: '40',  label: '40 — Isenta (Regime Normal)' },
  { value: '41',  label: '41 — Não tributada (Regime Normal)' },
  { value: '60',  label: '60 — ICMS cobrado anteriormente por ST (Regime Normal)' },
];

const CST_PIS_COFINS_OPTIONS = [
  { value: '07', label: '07 — Operação isenta da contribuição (Simples Nacional)' },
  { value: '01', label: '01 — Operação tributável — alíquota básica' },
  { value: '02', label: '02 — Operação tributável — alíquota diferenciada' },
  { value: '04', label: '04 — Operação tributável — monofásica' },
  { value: '49', label: '49 — Outras operações de saída' },
  { value: '99', label: '99 — Outras operações' },
];

// ─── Componente principal ─────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { company, isLoading, upsertCompany, isSaving } = useCompany();
  const { data: shopeeStatus, isLoading: isLoadingShopee } = useShopeeStatus();
  const shopeeAuthUrl = useShopeeAuthUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certFileName, setCertFileName] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      ie: '',
      im: '',
      regime_tributario: '',
      endereco_cep: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_complemento: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_uf: '',
      nfe_serie: '1',
      nfe_proximo_numero: 1,
      nfe_ambiente: 'homologacao',
      nfe_provedor: '',
      imposto_calculo_tipo: 'manual',
      cst_csosn_padrao: '',
      cst_pis_cofins: '',
      aliquota_simples: undefined,
      impostos_config: {},
      certificado_digital_url: '',
      certificado_senha_hash: '',
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        razao_social: company.razao_social || '',
        nome_fantasia: company.nome_fantasia || '',
        cnpj: company.cnpj || '',
        ie: company.ie || '',
        im: company.im || '',
        regime_tributario: company.regime_tributario || '',
        endereco_cep: company.endereco_cep || '',
        endereco_rua: company.endereco_rua || '',
        endereco_numero: company.endereco_numero || '',
        endereco_complemento: company.endereco_complemento || '',
        endereco_bairro: company.endereco_bairro || '',
        endereco_cidade: company.endereco_cidade || '',
        endereco_uf: company.endereco_uf || '',
        nfe_serie: company.nfe_serie || '1',
        nfe_proximo_numero: company.nfe_proximo_numero ?? 1,
        nfe_ambiente: company.nfe_ambiente || 'homologacao',
        nfe_provedor: company.nfe_provedor || '',
        imposto_calculo_tipo: company.imposto_calculo_tipo || 'manual',
        cst_csosn_padrao: company.cst_csosn_padrao || '',
        cst_pis_cofins: company.cst_pis_cofins || '',
        aliquota_simples: company.aliquota_simples ? Number(company.aliquota_simples) : undefined,
        impostos_config: company.impostos_config ? (typeof company.impostos_config === 'string' ? JSON.parse(company.impostos_config) : company.impostos_config) : {},
        certificado_digital_url: company.certificado_digital_url || '',
        certificado_senha_hash: '',
      });
    }
  }, [company, form]);

  const impostoCalculoTipo = form.watch('imposto_calculo_tipo');

  useEffect(() => {
    if (impostoCalculoTipo === 'ibpt') {
      const currentConfig = form.getValues('impostos_config') || {};
      form.setValue('impostos_config', {
        ...currentConfig,
        imposto_padrao: currentConfig.imposto_padrao ?? true,
        tipo_tributacao: currentConfig.tipo_tributacao || 'Simples Nacional',
        grupo_classe_impostos: currentConfig.grupo_classe_impostos || 'Classe de impostos para Saída de produtos de revenda',
        natureza_operacao_saida: currentConfig.natureza_operacao_saida || 'Venda de mercadorias',
        natureza_operacao_entrada: currentConfig.natureza_operacao_entrada || 'Devolução de mercadoria',
        observacao: currentConfig.observacao || '',
        icms_cenario: currentConfig.icms_cenario || 'Interno / Interestadual',
        icms_tipo_pessoa: currentConfig.icms_tipo_pessoa || 'Física / Jurídica',
        icms_cfop: currentConfig.icms_cfop || '5102',
        ipi_cst: currentConfig.ipi_cst || '99',
        informacoes_adicionais: currentConfig.informacoes_adicionais || 'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.'
      }, { shouldDirty: true });
      
      if (!form.getValues('cst_csosn_padrao')) form.setValue('cst_csosn_padrao', '400', { shouldDirty: true });
      if (!form.getValues('cst_pis_cofins')) form.setValue('cst_pis_cofins', '07', { shouldDirty: true });
    }
  }, [impostoCalculoTipo, form]);

  async function onSubmit(data: CompanyFormValues) {
    try {
      // Não reenviar senha vazia (mantém a existente)
      const payload = { ...data };
      if (!payload.certificado_senha_hash) {
        delete payload.certificado_senha_hash;
      }
      await upsertCompany(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleConnectShopee() {
    const result = await shopeeAuthUrl.mutateAsync();
    window.location.href = result.url;
  }

  if (isLoading) {
    return <div className="p-6 text-gray-500">Carregando configurações...</div>;
  }

  const isAmbienteProducao = form.watch('nfe_ambiente') === 'producao';
  const hasCertificado = !!company?.certificado_digital_url;

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">
          Dados da empresa, integração Shopee e configuração de notas fiscais.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="empresa" className="space-y-6">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto gap-0">
              <TabsTrigger
                value="empresa"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-gray-900"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Empresa
              </TabsTrigger>
              <TabsTrigger
                value="nfe"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-gray-900"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Notas Fiscais
              </TabsTrigger>
              <TabsTrigger
                value="integracao"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-gray-900"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Integrações
              </TabsTrigger>
            </TabsList>

            {/* ─── ABA: EMPRESA ─────────────────────────────────────────── */}
            <TabsContent value="empresa" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                  <CardDescription>Informações principais de identificação fiscal.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="razao_social"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Razão Social *</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua Empresa LTDA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nome_fantasia"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome Fantasia</FormLabel>
                        <FormControl>
                          <Input placeholder="Loja Incrível" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ (somente números) *</FormLabel>
                        <FormControl>
                          <Input placeholder="00000000000000" maxLength={14} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="regime_tributario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regime Tributário</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o regime" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                            <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                            <SelectItem value="MEI">MEI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual (IE)</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000.000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="im"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Municipal (IM)</FormLabel>
                        <FormControl>
                          <Input placeholder="Opcional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="endereco_cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="hidden md:block" />
                  <FormField
                    control={form.control}
                    name="endereco_rua"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Rua / Logradouro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Av Paulista" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco_numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco_complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Sala, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco_bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco_cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco_uf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado (UF)</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ABA: NOTAS FISCAIS ───────────────────────────────────── */}
            <TabsContent value="nfe" className="space-y-6 mt-0">

              {/* Subabas internas: Emissão / Certificado A1 / Classe de Impostos */}
              <Tabs defaultValue="emissao" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="emissao">
                    <FileText className="mr-2 h-4 w-4" />
                    Emissão
                  </TabsTrigger>
                  <TabsTrigger value="certificado">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Certificado A1
                  </TabsTrigger>
                  <TabsTrigger value="impostos">
                    <Receipt className="mr-2 h-4 w-4" />
                    Classe de Impostos
                  </TabsTrigger>
                </TabsList>

                {/* Sub-aba: Emissão */}
                <TabsContent value="emissao" className="space-y-4">

                  {/* Bloco de atenção fiscal */}
                  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-900 space-y-2">
                      <p className="font-bold text-base">⚠️ ATENÇÃO — Série e Numeração da NF-e</p>
                      <p>As configurações de <strong>Série</strong> e <strong>Número da Próxima Nota Fiscal</strong> são de <strong>extrema importância</strong>. Os intervalos entre os números devem ser sequenciais — caso a numeração pule, é necessário realizar a <strong>inutilização da numeração</strong> perante à SEFAZ para evitar multas ao Fisco.</p>
                      <ul className="space-y-1 pl-1">
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-red-500">▶</span>
                          <span><strong>Nova empresa:</strong> Informe a série igual a <strong>1</strong> e o número da próxima nota igual a <strong>1</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-red-500">▶</span>
                          <span><strong>Substituição de emissor antigo:</strong> Informe a <strong>mesma série</strong> utilizada no emissor anterior e o número que deverá ser emitido na próxima NF-e.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 text-red-500">▶</span>
                          <span><strong>Continuação com novo emissor:</strong> Inicie uma nova sequência em outra série (entre <strong>2 e 99</strong>) e informe o número da próxima nota como <strong>1</strong>.</span>
                        </li>
                      </ul>
                      <p className="text-xs text-red-700 border-t border-red-200 pt-2 mt-1">Em caso de dúvida, consulte seu contador antes de alterar estes valores.</p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Numeração da NF-e</CardTitle>
                      <CardDescription>
                        Defina a série e o próximo número a ser emitido.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nfe_serie"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Série da NF-e</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={99}
                                placeholder="1"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Valor entre 1 e 99. Para novas empresas: <strong>1</strong>.
                              Para novo emissor em paralelo: entre <strong>2 e 99</strong>.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nfe_proximo_numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número da Próxima NF-e</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="1"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Para novas empresas: <strong>1</strong>. Para continuação de emissor antigo:
                              informe o próximo número sequencial.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Provedor e Ambiente</CardTitle>
                      <CardDescription>
                        Define como e onde as notas serão transmitidas para a SEFAZ.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nfe_ambiente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ambiente de Emissão</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o ambiente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="homologacao">
                                  🧪 Homologação (Testes — sem efeito fiscal)
                                </SelectItem>
                                <SelectItem value="producao">
                                  🟢 Produção (Notas Reais com validade legal)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nfe_provedor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provedor de Emissão (API)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o provedor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="focus_nfe">Focus NFe</SelectItem>
                                <SelectItem value="nfeio">NFe.io</SelectItem>
                                <SelectItem value="tecnospeed">Tecnospeed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              API intermediária que assina e transmite a NF-e para a SEFAZ.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {isAmbienteProducao && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">Você está em modo Produção</p>
                        <p>As notas emitidas serão <strong>NF-e reais</strong> com validade jurídica e fiscal. Certifique-se de que a série e numeração estão corretas antes de emitir.</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Sub-aba: Certificado A1 */}
                <TabsContent value="certificado" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Certificado Digital A1
                      </CardTitle>
                      <CardDescription>
                        O certificado digital é necessário para assinar eletronicamente as NF-e emitidas em Produção. Arquivo no formato <strong>.pfx</strong>.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Status do certificado */}
                      <div className={`flex items-center gap-3 rounded-lg border p-4 ${hasCertificado ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        {hasCertificado ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-green-800">Certificado configurado</p>
                              <p className="text-xs text-green-600 font-mono mt-0.5 truncate max-w-[300px]">
                                {company?.certificado_digital_url}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Info className="h-5 w-5 text-gray-400 shrink-0" />
                            <p className="text-sm text-gray-500">Nenhum certificado configurado ainda.</p>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        <FormLabel>Arquivo do Certificado (.pfx)</FormLabel>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {certFileName ? 'Trocar Arquivo' : 'Selecionar Certificado A1'}
                          </Button>
                          <span className="text-sm text-gray-500 truncate max-w-[300px]">
                            {certFileName || (hasCertificado ? 'Certificado atual ativo. Selecione para substituir.' : 'Nenhum arquivo selecionado')}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".pfx"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCertFileName(file.name);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                form.setValue('certificado_base64', base64, { shouldDirty: true });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <p className="text-[0.8rem] text-muted-foreground mt-2">
                          Selecione o arquivo .pfx do seu computador. Ele será enviado de forma segura para o servidor.
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="certificado_senha_hash"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha do Certificado</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={hasCertificado ? '••••••••  (deixe em branco para manter)' : 'Senha do arquivo .pfx'}
                                autoComplete="new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {hasCertificado
                                ? 'Deixe em branco para manter a senha atual. Preencha apenas para alterar.'
                                : 'Senha definida no momento da emissão do certificado pela autoridade certificadora.'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-800 space-y-1">
                          <p className="font-semibold">Segurança do certificado</p>
                          <p>O certificado A1 não é armazenado em texto puro no banco. A URL aponta para um bucket seguro com acesso restrito via RLS do Supabase.</p>
                          <p>A senha é salva com hash e nunca é exibida após salvar.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sub-aba: Classe de Impostos */}
                <TabsContent value="impostos" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Classe de Impostos Padrão</CardTitle>
                      <CardDescription>
                        Defina os códigos tributários padrão aplicados automaticamente na emissão de NF-e.
                        Podem ser sobrescritos individualmente em cada produto.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-red-800 space-y-1">
                          <p className="font-bold text-red-900">ATENÇÃO:</p>
                          <p>Antes de fazer qualquer alteração em classe de impostos, consulte com seu contador profissional para evitar problemas fiscais ou multas causados ​​por configurações incorretas.</p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="imposto_calculo_tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Tributação / Classe de Impostos</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'manual'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o método de cálculo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ibpt">Taxa de Imposto Estimada do IBPT</SelectItem>
                                <SelectItem value="manual">Configurar Manualmente</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Escolha como deseja obter a carga tributária para a NF-e: automático por IBPT ou de forma manual.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('imposto_calculo_tipo') === 'ibpt' && (
                        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-blue-800 space-y-1">
                            <p className="font-semibold text-blue-900">Imposto Estimado do IBPT Ativo</p>
                            <p>O RayHub usará as tabelas do IBPT para estimar a carga tributária na nota fiscal. Porém, você ainda pode configurar os campos manuais abaixo como padrão da empresa.</p>
                          </div>
                        </div>
                      )}

                      <Tabs defaultValue="basica" className="w-full mt-6">
                        <TabsList className="mb-4 flex flex-wrap gap-2 h-auto w-full justify-start bg-transparent border-b rounded-none pb-px">
                          <TabsTrigger value="basica" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2">Informação Básica</TabsTrigger>
                          <TabsTrigger value="icms" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2">ICMS</TabsTrigger>
                          <TabsTrigger value="ipi" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2">IPI</TabsTrigger>
                          <TabsTrigger value="pis_cofins" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2">PIS/COFINS</TabsTrigger>
                          <TabsTrigger value="adicionais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2">Informações Adicionais</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basica" className="space-y-4">
                          <div className="font-semibold text-lg text-slate-800 border-b pb-2 mb-4">Informação Básica - Empresas</div>
                          <FormField control={form.control} name="impostos_config.imposto_padrao" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <input type="checkbox" className="h-4 w-4" checked={field.value !== false} onChange={(e) => field.onChange(e.target.checked)} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Configure como Classe Padrão para essa Empresa</FormLabel>
                              </div>
                            </FormItem>
                          )} />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="impostos_config.tipo_tributacao" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Tributação</FormLabel>
                                <FormControl><Input placeholder="Ex: Simples Nacional" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.grupo_classe_impostos" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grupo de Classe de Impostos</FormLabel>
                                <FormControl><Input placeholder="Classe de impostos para Saída de produtos de revenda" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.natureza_operacao_saida" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Natureza de operação (Saída)</FormLabel>
                                <FormControl><Input placeholder="Venda de mercadorias" {...field} value={field.value || ''} /></FormControl>
                                <FormDescription className="text-xs">Para operações de amostras grátis/bonificação, recomenda-se configurar como "Bonificação - Sem finalidade de Revenda"</FormDescription>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.natureza_operacao_entrada" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Natureza de operação (Entrada)</FormLabel>
                                <FormControl><Input placeholder="Devolução de mercadoria" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                          
                          <FormField control={form.control} name="impostos_config.observacao" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observação</FormLabel>
                              <FormControl><Input placeholder="Observações da classe básica" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                          )} />
                        </TabsContent>

                        <TabsContent value="icms" className="space-y-4">
                          <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <div className="font-semibold text-lg text-slate-800">ICMS</div>
                            <button type="button" className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-700">Copiar para todos os Cenários</button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="impostos_config.icms_cenario" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cenário</FormLabel>
                                <FormControl><Input placeholder="Ex: Interno / Interestadual" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.icms_tipo_pessoa" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo pessoa</FormLabel>
                                <FormControl><Input placeholder="Ex: Física / Jurídica" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.icms_cfop" render={({ field }) => (
                              <FormItem>
                                <FormLabel>CFOP</FormLabel>
                                <FormControl><Input placeholder="Ex: 5102" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="cst_csosn_padrao" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Situação tributária (CSOSN / CST)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o CST/CSOSN" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {CST_CSOSN_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.icms_codigo_beneficio" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código de Benefício Fiscal</FormLabel>
                                <FormControl><Input placeholder="Insira o Código de Benefício" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.icms_credito_presumido" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Crédito Presumido (%)</FormLabel>
                                <FormControl><Input placeholder="Insira a porcentagem" type="number" step="0.01" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="aliquota_simples" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Alíquota Efetiva do Simples Nacional (%)</FormLabel>
                                <FormControl><Input type="number" step="0.01" min={0} max={100} placeholder="Ex: 6.00" {...field} value={field.value ?? ''} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="impostos_config.icms_observacoes" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl><Input placeholder="Incluir observações" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                          )} />
                        </TabsContent>

                        <TabsContent value="ipi" className="space-y-4">
                          <div className="font-semibold text-lg text-slate-800 border-b pb-2 mb-4">IPI</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="impostos_config.ipi_cst" render={({ field }) => (
                              <FormItem>
                                <FormLabel>CST IPI</FormLabel>
                                <FormControl><Input placeholder="Ex: 99 - Outras Saídas" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="impostos_config.ipi_codigo_enquadramento" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código de Enquadramento</FormLabel>
                                <FormControl><Input placeholder="Ex: 999" {...field} value={field.value || ''} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                        </TabsContent>

                        <TabsContent value="pis_cofins" className="space-y-4">
                          <div className="font-semibold text-lg text-slate-800 border-b pb-2 mb-4">PIS e COFINS</div>
                          <div className="grid grid-cols-1 gap-4">
                            <FormField control={form.control} name="cst_pis_cofins" render={({ field }) => (
                              <FormItem>
                                <FormLabel>CST PIS/COFINS Padrão</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o CST PIS/COFINS" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {CST_PIS_COFINS_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>Para optantes do Simples Nacional: <strong>07 (isento)</strong>.</FormDescription>
                              </FormItem>
                            )} />
                          </div>
                        </TabsContent>

                        <TabsContent value="adicionais" className="space-y-4">
                          <div className="font-semibold text-lg text-slate-800 border-b pb-2 mb-4">Informações Adicionais</div>
                          <FormField control={form.control} name="impostos_config.informacoes_adicionais" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Informações Adicionais de Interesse do Fisco</FormLabel>
                              <FormControl><textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Mensagem a ser impressa nos dados adicionais da nota..." {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                          )} />
                        </TabsContent>
                      </Tabs>

                      <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4 mt-8">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800">
                          Essas configurações são padrões aplicados automaticamente. Para produtos com tributações específicas (ex: ST, monofásico), sobrescreva individualmente na edição do produto.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ─── ABA: INTEGRAÇÕES ─────────────────────────────────────── */}
            <TabsContent value="integracao" className="space-y-6 mt-0">
              <Card className={shopeeStatus?.connected ? 'border-green-200 bg-green-50/40' : 'border-orange-200 bg-orange-50/40'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
                        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="text-lg">Integração Shopee</CardTitle>
                        <CardDescription>
                          {shopeeStatus?.connected
                            ? `Loja #${shopeeStatus.shopId} conectada`
                            : 'Conecte sua loja Shopee para sincronizar pedidos'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={shopeeStatus?.connected ? 'default' : 'secondary'} className={shopeeStatus?.connected ? 'bg-green-600' : ''}>
                      {isLoadingShopee ? '...' : shopeeStatus?.connected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {shopeeStatus?.connected ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Shop ID:</span> {shopeeStatus.shopId}
                      </div>
                      {shopeeStatus.expiresAt && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Token expira em:</span>{' '}
                          {new Date(shopeeStatus.expiresAt).toLocaleString('pt-BR')}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleConnectShopee}
                        disabled={shopeeAuthUrl.isPending}
                        className="mt-2"
                      >
                        Reconectar / Atualizar token
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Para sincronizar seus pedidos reais da Shopee, conecte sua conta de vendedor.
                        Você será redirecionado para a Shopee para autorizar o acesso.
                      </p>
                      {!company?.id && (
                        <div className="rounded-lg bg-red-100/80 border border-red-200 p-3 text-xs text-red-800">
                          <strong>⚠️ Atenção:</strong> Você precisa preencher e <strong>Salvar</strong> os dados da empresa (aba Empresa) antes de realizar a conexão.
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={handleConnectShopee}
                        disabled={shopeeAuthUrl.isPending || !company?.id}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {shopeeAuthUrl.isPending ? 'Redirecionando...' : 'Conectar com a Shopee'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ─── Footer de salvar ────────────────────────────────────────── */}
          <div className="fixed bottom-0 left-60 right-0 p-4 bg-white border-t flex items-center justify-between shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
            <div>
              {saveSuccess && (
                <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Configurações salvas com sucesso!
                </span>
              )}
            </div>
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
