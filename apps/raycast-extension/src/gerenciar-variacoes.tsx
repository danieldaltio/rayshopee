import { useState, useMemo } from "react";
import { ActionPanel, Action, List, Icon, Form, showToast, Toast, useNavigation, Color } from "@raycast/api";
import { usePromise } from "@raycast/utils";

const API_BASE = "http://localhost:3003/api";

interface Product {
  item_id: string | number;
  model_id: string | number;
  name: string;
  variation: string;
  sku: string;
  image: string;
  price: number;
  stock: number;
  cost: number;
  profit?: number;
  margin?: number;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");

  const { isLoading, data, mutate } = usePromise(
    async (query: string) => {
      const endpoint = query 
        ? `${API_BASE}/products/search?q=${encodeURIComponent(query)}` 
        : `${API_BASE}/products?offset=0&page_size=100`;
      
      const res = await fetch(endpoint);
      const result = await res.json();
      if (result.error) throw new Error(result.message || result.error);
      return { products: (result.products || []) as Product[] };
    },
    [searchText]
  );

  // Agrupar produtos por item_id
  const groupedProducts = useMemo(() => {
    const groups: Record<string, { name: string; image: string; variations: Product[] }> = {};
    
    (data?.products || []).forEach((p) => {
      const itemId = String(p.item_id);
      if (!groups[itemId]) {
        groups[itemId] = {
          name: p.name,
          image: p.image,
          variations: [],
        };
      }
      groups[itemId].variations.push(p);
    });
    
    return Object.entries(groups).map(([itemId, group]) => ({
      itemId,
      ...group,
    }));
  }, [data]);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Buscar Produto Pai..."
    >
      {groupedProducts.map((group) => (
        <List.Item
          key={group.itemId}
          icon={group.image ? { source: group.image } : Icon.Box}
          title={group.name}
          subtitle={`ID: ${group.itemId}`}
          accessories={[
            { text: `${group.variations.length} variações`, icon: Icon.Layers },
            { text: `Estoque Total: ${group.variations.reduce((sum, v) => sum + v.stock, 0)}` }
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Gerenciar Variações"
                icon={Icon.List}
                target={<VariationList group={group} mutate={mutate} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function VariationList({ group, mutate }: { group: any; mutate: any }) {
  return (
    <List title={`Variações: ${group.name}`}>
      {group.variations.map((v: Product) => (
        <List.Item
          key={`${v.item_id}_${v.model_id}`}
          title={v.variation || "Padrão"}
          subtitle={v.sku}
          accessories={[
            { text: `V: R$ ${v.price.toFixed(2)}`, tooltip: "Venda" },
            { text: `C: R$ ${v.cost?.toFixed(2) || "0.00"}`, tooltip: "Custo" },
            { 
              text: `L: R$ ${v.profit?.toFixed(2) || "0.00"}`, 
              color: (v.profit || 0) > 0 ? Color.Green : Color.Red,
              tooltip: `Lucro (Margem: ${v.margin}%)` 
            },
            { icon: Icon.Hashtag, text: `${v.stock} un` },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Alterar Preço"
                icon={Icon.BankNotes}
                target={<UpdateFieldForm product={v} field="price" mutate={mutate} />}
              />
              <Action.Push
                title="Alterar Estoque"
                icon={Icon.Hashtag}
                target={<UpdateFieldForm product={v} field="stock" mutate={mutate} />}
              />
              <Action.Push
                title="Alterar Custo"
                icon={Icon.Coin}
                target={<UpdateFieldForm product={v} field="cost" mutate={mutate} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function UpdateFieldForm({ product, field, mutate }: { product: Product; field: string; mutate: any }) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const fieldLabels: Record<string, string> = {
    price: "Preço de Venda (R$)",
    stock: "Estoque (un)",
    cost: "Preço de Custo (R$)"
  };

  async function handleSubmit(values: any) {
    setIsLoading(true);
    const cleanValue = values.value.replace(",", ".");
    const value = parseFloat(cleanValue);

    if (isNaN(value)) {
      showToast(Toast.Style.Failure, "Valor inválido");
      setIsLoading(false);
      return;
    }

    const updatePayload: any = {
      item_id: product.item_id,
      model_id: product.model_id
    };

    if (field === "price") updatePayload.newPrice = value;
    if (field === "stock") updatePayload.newStock = value;
    if (field === "cost") updatePayload.newCost = value;

    try {
      const updatePromise = fetch(`${API_BASE}/products/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [updatePayload] })
      }).then(res => res.json());

      await mutate(updatePromise, {
        optimisticUpdate: (currentData) => {
          if (!currentData || !currentData.products) return currentData;
          return {
            ...currentData,
            products: currentData.products.map(p => {
              if (p.item_id === product.item_id && p.model_id === product.model_id) {
                return { 
                  ...p, 
                  price: field === "price" ? value : p.price,
                  stock: field === "stock" ? value : p.stock,
                  cost: field === "cost" ? value : p.cost
                };
              }
              return p;
            })
          };
        },
        rollbackOnError: true,
        shouldRevalidateAfter: false
      });

      await showToast(Toast.Style.Success, "Atualizado com sucesso!");
      pop();
    } catch (err) {
      await showToast(Toast.Style.Failure, "Erro ao atualizar");
    }
    setIsLoading(false);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Salvar" onSubmit={handleSubmit} icon={Icon.Check} />
        </ActionPanel>
      }
    >
      <Form.Description title="Produto" text={product.name} />
      <Form.Description title="Variação" text={product.variation} />
      <Form.Separator />
      <Form.TextField
        id="value"
        title={fieldLabels[field]}
        defaultValue={(product as any)[field]?.toString()}
      />
    </Form>
  );
}
