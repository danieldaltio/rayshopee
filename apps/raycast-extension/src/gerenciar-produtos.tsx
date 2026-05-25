import { useState } from "react";
import { ActionPanel, Action, List, Icon, Form, showToast, Toast, useNavigation, Color } from "@raycast/api";
import { usePromise } from "@raycast/utils";

const API_BASE = "http://localhost:3003/api";

export default function Command() {
  const [searchText, setSearchText] = useState("");

  const { isLoading, data, mutate } = usePromise(
    async (query: string) => {
      if (!query) {
        // Initial load: fetch first page only
        const res = await fetch(`${API_BASE}/products?offset=0&page_size=50`);
        const result = await res.json();
        if (result.error) throw new Error(result.message || result.error);
        return { products: result.products || [] };
      } else {
        // Specific search: use the search endpoint
        const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
        const result = await res.json();
        if (result.error) throw new Error(result.message || result.error);
        
        // Also try searching by SKU specifically if no results from name
        if ((!result.products || result.products.length === 0) && query.length > 3) {
          const skuRes = await fetch(`${API_BASE}/products/search?sku=${encodeURIComponent(query)}`);
          const skuResult = await skuRes.json();
          return { products: skuResult.products || [] };
        }
        
        return { products: result.products || [] };
      }
    },
    [searchText]
  );

  const products = data?.products || [];

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Buscar produto ou SKU..."
    >
      {products.map((product) => {
        const title = product.name;
        const variation = product.variation !== "—" ? product.variation : "";
        const sku = product.sku || "";
        
        return (
          <List.Item
            key={`${product.item_id}_${product.model_id}`}
            icon={product.image ? { source: product.image } : Icon.Box}
            title={title}
            subtitle={variation ? variation : sku}
            keywords={[sku, variation].filter(Boolean)}
          accessories={[
            { text: `V: R$ ${product.price.toFixed(2)}`, tooltip: "Preço de Venda" },
            { text: `C: R$ ${product.cost?.toFixed(2) || "0.00"}`, tooltip: "Preço de Custo" },
            { 
              text: `L: R$ ${product.profit?.toFixed(2) || "0.00"}`, 
              color: product.profit > 0 ? Color.Green : Color.Red,
              tooltip: `Lucro Líquido (Margem: ${product.margin}%)` 
            },
            { icon: Icon.Hashtag, text: `${product.stock} un`, tooltip: "Estoque" },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                icon={Icon.BankNotes}
                title="Alterar Preço de Venda"
                target={<UpdatePriceForm product={product} mutate={mutate} />}
              />
              <Action.Push
                icon={Icon.Coin}
                title="Alterar Preço de Custo"
                target={<UpdateCostForm product={product} mutate={mutate} />}
              />
              <Action.Push
                icon={Icon.Hashtag}
                title="Alterar Estoque"
                target={<UpdateStockForm product={product} mutate={mutate} />}
              />
            </ActionPanel>
          }
          />
        );
      })}
    </List>
  );
}

function UpdatePriceForm({ product, mutate }) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values) {
    setIsLoading(true);
    // Troca vírgula por ponto para aceitar o formato brasileiro
    const cleanPrice = values.price.replace(",", ".");
    const newPrice = parseFloat(cleanPrice);
    
    if (isNaN(newPrice)) {
      showToast(Toast.Style.Failure, "Preço inválido");
      setIsLoading(false);
      return;
    }

    try {
      const updatePromise = fetch(`${API_BASE}/products/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{
            item_id: product.item_id,
            model_id: product.model_id,
            newPrice: newPrice
          }]
        })
      }).then(res => res.json());

      await mutate(updatePromise, {
        optimisticUpdate: (currentData) => {
          if (!currentData || !currentData.products) return currentData;
          return {
            ...currentData,
            products: currentData.products.map(p => {
              if (p.item_id === product.item_id && p.model_id === product.model_id) {
                return { ...p, price: newPrice };
              }
              return p;
            })
          };
        },
        rollbackOnError: true,
        shouldRevalidateAfter: false // Avoid revalidating immediately due to Shopee API cache
      });

      await showToast(Toast.Style.Success, "Preço atualizado com sucesso!");
      pop();
    } catch (err) {
      await showToast(Toast.Style.Failure, "Erro ao atualizar", err.message);
    }
    setIsLoading(false);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Salvar Preço" onSubmit={handleSubmit} icon={Icon.Check} />
        </ActionPanel>
      }
    >
      <Form.Description title="Produto" text={product.name} />
      {product.variation !== "—" && <Form.Description title="Variação" text={product.variation} />}
      <Form.Separator />
      <Form.TextField
        id="price"
        title="Novo Preço (R$)"
        defaultValue={product.price.toString()}
        placeholder="Ex: 49.90"
      />
    </Form>
  );
}

function UpdateStockForm({ product, mutate }) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values) {
    setIsLoading(true);
    const newStock = parseInt(values.stock, 10);
    
    if (isNaN(newStock) || newStock < 0) {
      showToast(Toast.Style.Failure, "Estoque inválido");
      setIsLoading(false);
      return;
    }

    try {
      const updatePromise = fetch(`${API_BASE}/products/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{
            item_id: product.item_id,
            model_id: product.model_id,
            newStock: newStock
          }]
        })
      }).then(res => res.json());

      await mutate(updatePromise, {
        optimisticUpdate: (currentData) => {
          if (!currentData || !currentData.products) return currentData;
          return {
            ...currentData,
            products: currentData.products.map(p => {
              if (p.item_id === product.item_id && p.model_id === product.model_id) {
                return { ...p, stock: newStock };
              }
              return p;
            })
          };
        },
        rollbackOnError: true,
        shouldRevalidateAfter: false // Avoid revalidating immediately due to Shopee API cache
      });

      await showToast(Toast.Style.Success, "Estoque atualizado com sucesso!");
      pop();
    } catch (err) {
      await showToast(Toast.Style.Failure, "Erro ao atualizar", err.message);
    }
    setIsLoading(false);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Salvar Estoque" onSubmit={handleSubmit} icon={Icon.Check} />
        </ActionPanel>
      }
    >
      <Form.Description title="Produto" text={product.name} />
      {product.variation !== "—" && <Form.Description title="Variação" text={product.variation} />}
      <Form.Separator />
      <Form.TextField
        id="stock"
        title="Novo Estoque"
        defaultValue={product.stock.toString()}
        placeholder="Ex: 100"
      />
    </Form>
  );
}
function UpdateCostForm({ product, mutate }) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values) {
    setIsLoading(true);
    // Troca vírgula por ponto para aceitar o formato brasileiro
    const cleanCost = values.cost.replace(",", ".");
    const newCost = parseFloat(cleanCost);

    if (isNaN(newCost)) {
      showToast(Toast.Style.Failure, "Custo inválido");
      setIsLoading(false);
      return;
    }

    try {
      const updatePromise = fetch(`${API_BASE}/products/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            {
              item_id: product.item_id,
              model_id: product.model_id,
              newCost: newCost,
            },
          ],
        }),
      }).then((res) => res.json());

      await mutate(updatePromise, {
        optimisticUpdate: (currentData) => {
          if (!currentData || !currentData.products) return currentData;
          return {
            ...currentData,
            products: currentData.products.map((p) => {
              if (p.item_id === product.item_id && p.model_id === product.model_id) {
                return { ...p, cost: newCost };
              }
              return p;
            }),
          };
        },
        rollbackOnError: true,
        shouldRevalidateAfter: false,
      });

      await showToast(Toast.Style.Success, "Custo atualizado no banco de dados!");
      pop();
    } catch (err) {
      await showToast(Toast.Style.Failure, "Erro ao atualizar custo", err.message);
    }
    setIsLoading(false);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Salvar Custo" onSubmit={handleSubmit} icon={Icon.Check} />
        </ActionPanel>
      }
    >
      <Form.Description title="Produto" text={product.name} />
      {product.variation !== "—" && <Form.Description title="Variação" text={product.variation} />}
      <Form.Separator />
      <Form.TextField
        id="cost"
        title="Novo Preço de Custo (R$)"
        defaultValue={product.cost?.toString() || "0.00"}
        placeholder="Ex: 15.50"
      />
    </Form>
  );
}
