# 📋 DOCUMENTAÇÃO COMPLETA - ShopeeLister

## Última Atualização: 2026-05-13

---

## 🎯 OBJETIVO DO PROJETO

Desenvolver o app **ShopeeLister** para Android (Kotlin/Jetpack Compose) que permite:
- Escaneear código de barras (EAN)
- Buscar informações do produto via IA
- Editar dados (preço, estoque, título, descrição)
- Publicar produtos na Shopee via API Open Platform

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. Scanner de Código de Barras
- Câmera com CameraX
- ML Kit para reconhecimento
- Leitura de EAN/GTIN

### 2. Busca de Produto
- Scraper para buscar dados do produto pela internet
- IA Groq (Llama 3.3) para gerar descrição e título
- Fallback para dados manuais

### 3. Edição de Produto
- Interface Compose com campos editáveis
- Título, descrição, preço, estoque
- SKU automático
- Seleção de categoria
- Imagem com remoção de fundo nativa (Cloudinary AI com HTTP Multipart / SHA-1)

### 4. Publicação na Shopee
- API Shopee Open Platform v2
- Upload de imagem
- Publicação de produto com variações
- **CANAIS DE LOGÍSTICA** (IMPLEMENTADO)
  - Seleção nas Settings com checkboxes
  - Fallback automático para canais padrão do Brasil

### 5. Configurações
- Importação de credenciais do servidor RayShopee
- Campos para Partner ID, Partner Key, Access Token
- Métodos de envio (logística)
- Remoção de fundo toggle

---

## ⚠️ ERROS IDENTIFICADOS E SOLUÇÕES

### 1. ❌ ERRO: "Nenhum canal de logística encontrado na API"
**Causa:** API retornava lista vazia quando o Access Token estava vazio ou expirado.

**Solução Implementada:**
- Adicionado fallback para canais padrão do Brasil:
  - Normal Delivery (ID: 100006)
  - Shopee Express Delivery (ID: 100005)
  - Pick-up at Store (ID: 100007)

### 2. ❌ ERRO: HTTP 403 Forbidden
**Causa:** Access Token expirado ou credenciais incorretas.

**Solução Implementada:**
- Tokens salvos no `gradle.properties` e `BuildConfig`
- ShopeeAuthInterceptor agora usa tokens do BuildConfig como fallback
- Logs de debug adicionados para diagnóstico

### 3. ❌ ERRO: Moshi KSP "Error preparing class"
**Causa:** Classes duplicadas (AddItemResponse, UploadImageResponse, ImageInfo).

**Solução:** Removidas classes duplicadas do ShopeeModels.kt

### 4. ❌ ERRO: Condição e status eram String (devem ser Int)
**Causa:** API Shopee espera `condition: 1` (não `"NEW"`).

**Solução:**
- `condition` alterado de `String` para `Int` (1 = NEW)
- `item_status` alterado de `String` para `Int` (1 = NORMAL)

---

## 🔧 ARQUIVOS MODIFICADOS

### Data Layer
```
ShopeeLister/app/.../data/
├── local/
│   └── ConfigStore.kt              # + Logística preferences
├── remote/
│   ├── shopee/
│   │   ├── ShopeeApiService.kt     # + setChannel, getChannelList
│   │   ├── ShopeeAuthInterceptor.kt # + Logs, fallback tokens
│   │   └── ShopeeModels.kt         # + LogisticsChannelItem, SetChannelRequest
├── repository/
│   └── ShopeeRepositoryImpl.kt     # + Lógica logística com fallback
```

### UI Layer
```
ShopeeLister/app/.../ui/
├── settings/
│   ├── SettingsScreen.kt            # + Checkboxes logística
│   └── SettingsViewModel.kt        # + Estado logística
├── editor/
│   └── EditorScreen.kt             # + Card de erro melhorado
```

### Config
```
ShopeeLister/
├── gradle.properties                # + Tokens e Shop ID
├── app/build.gradle.kts             # + BuildConfig tokens
```

---

## 🔑 CREDENCIAIS CONFIGURADAS

```properties
SHOPEE_PARTNER_ID=2033681
SHOPEE_PARTNER_KEY=shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c
SHOPEE_SHOP_ID=263124677
SHOPEE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gASilo4nQBjDA38_gAzgBQAFICQ.eqZnjm_1OwRwnG6d-dmmnZbA_eViVSVDwyzezSTKavY
SHOPEE_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gAiilo4nQBjDgxsCpBzgBQAFICQ.hYleTxaqtaBTWEXllTsuSCfPIO6__MmQTJpNPzNOfA8
```

⚠️ **IMPORTANTE:** O Access Token expira em ~4 horas. Pode necessitar reautorização.

---

## 📊 STATUS ATUAL

| Funcionalidade | Status |
|----------------|--------|
| Scanner de barras | ✅ Funcionando |
| Busca de produto (scraper) | ✅ Funcionando |
| IA Groq (descrições) | ✅ Funcionando |
| Remoção de fundo (Cloudinary) | ✅ Estável (v1.1.0) |
| Edição de produto | ✅ Funcionando |
| Seleção de logística | ✅ Implementado |
| Fallback logística | ✅ Implementado |
| Publicação na Shopee | ⚠️ HTTP 403 (token expirado?) |

---

## 🎯 PRÓXIMOS PASSOS

### 1. Reautorização (CRÍTICO)
O Access Token provavelmente expirou. Necessário:

1. Abrir app > Configurações
2. Clicar em **"Linkar Loja (Abrir Navegador)"**
3. Fazer login na Shopee e autorizar
4. Copiar código da URL (após `code=`)
5. Colar em "Código de Autorização"
6. Clicar **"Finalizar Login"**

### 2. Teste de Publicação
Após reautorização, testar publicação de produto.

### 3. Implementar Refresh Automático
Adicionar lógica para renovar Access Token automaticamente usando Refresh Token.

### 4. Implementar Seleção de Logística via API
Ao invés de usar fallback fixo, buscar canais da loja e permitir seleção dinâmica.

---

## 📝 COMANDOS ÚTEIS

```bash
# Build APK
cd ShopeeLister && ./gradlew assembleDebug

# Instalar APK no celular (USB)
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Ver logs do app
adb logcat -s ShopeeRepo:V ShopeeAuth:V

# Limpar dados do app
adb shell pm clear com.shopeelister

# Desinstalar
adb uninstall com.shopeelister
```

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

- [Shopee Open Platform](https://open.shopee.com/)
- [Documentação API v2](https://open.shopee.com/documents/v2)
- [Guia de Autenticação](https://open.shopee.com/developer-guide/16)

---

## 🔗 ESTRUTURA DO PROJETO

```
RayShopee/
├── ShopeeLister/                    # App Android (ESTE)
│   ├── app/
│   │   └── src/main/
│   │       └── java/com/shopeelister/
│   │           ├── data/            # Repositories, API, Models
│   │           ├── domain/          # UseCases, Models
│   │           ├── di/              # Hilt modules
│   │           ├── ui/              # Compose screens
│   │           └── util/            # Constants
│   └── gradle.properties
├── RayShopeeAndroid/                # Outro app (scanner)
├── server/                          # Backend Node.js
├── docs/                            # Documentação adicional
└── .env                             # Credenciais
```