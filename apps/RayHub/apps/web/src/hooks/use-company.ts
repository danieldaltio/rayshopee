import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface CompanyData {
  id?: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  ie?: string;
  im?: string;
  regime_tributario?: string;
  endereco_cep?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  certificado_digital_url?: string;
  certificado_senha_hash?: string;
  logo_url?: string;
  // NF-e
  nfe_serie?: string;
  nfe_proximo_numero?: number;
  nfe_ambiente?: string;
  nfe_provedor?: string;
  // Classe de impostos
  cst_csosn_padrao?: string;
  cst_pis_cofins?: string;
  aliquota_simples?: number | string;
}

export function useCompany() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['company'],
    queryFn: async (): Promise<CompanyData> => {
      const response = await api.get('/company');
      return response.data || {}; // If empty/not-found return empty object
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: CompanyData) => {
      const response = await api.put('/company', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });

  return {
    company: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    upsertCompany: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}
