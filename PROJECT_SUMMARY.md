# RayShopee - Resumo Completo do Projeto

## 📋 Visão Geral

**RayShopee** é um sistema de gestão de estoque e preços para vendedores Shopee com:
- Backend Node.js para API
- App Android com scanner de código de barras
- Interface web para gerência
- Integração com API da Shopee

---

## 🏗️ Arquitetura

### Backend (Node.js + Express)
- **Porta**: 3003 (Oracle Cloud)
- **API**: `http://64.181.161.232:3003` (Oracle Cloud VM)
- **Endpoints**: `/api/products/*`
- **Stack**: Express, Supabase, Shopee API

### Android App (Kotlin + Jetpack Compose)
- **Scanner**: CameraX + ML Kit Barcode
- **Rede**: Retrofit + OkHttp
- **Build**: Gradle 9.5, JDK 25, AGP 9.0
- **APK**: `RayShopeeAndroid/app/build/outputs/apk/debug/app-debug.apk`

### Web (React + Vite)
- Dashboard para gerência

---

## ☁️ Oracle Cloud Setup (2026-05-02)

### Conta Free Tier
- **URL**: https://cloud.oracle.com
- **Usuário**: danieldaltio@gmail.com
- **Região**: São Paulo (sa-saopaulo-1)
- **Recursos Always Free**:
  - VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)
  - 200GB Block Storage

### Criação via CloudShell

```bash
# 1. VCN com Internet Gateway
oci network vcn create --compartment-id OCID --cidr-block 10.0.0.0/16 --display-name rayshopee-vcn --dns-label rayshopee --wait-for-state AVAILABLE

# 2. Internet Gateway
oci network internet-gateway create --compartment-id OCID --vcn-id VCN_OCID --display-name rayshopee-ig --is-enabled true --wait-for-state AVAILABLE

# 3. Subnet pública
oci network subnet create --compartment-id OCID --vcn-id VCN_OCID --cidr-block 10.0.0.0/24 --display-name rayshopee-public --dns-label rayshopub --prohibit-public-ip-on-vnic false --wait-for-state AVAILABLE

# 4. Route Table (default já tem internet gateway)

# 5. Security List (aberto tudo)
oci network security-list update --security-list-id SL_OCID --egress-security-rules '[{"destination":"0.0.0.0/0","protocol":"all"}]' --ingress-security-rules '[{"protocol":"all","source":"0.0.0.0/0"}]'

# 6. IP Público Reservado
oci network public-ip create --compartment-id OCID --lifetime RESERVED --display-name rayshopee-ip

# 7. VM
oci compute instance launch --compartment-id OCID --availability-domain "PMCB:SA-SAOPAULO-1-AD-1" --subnet-id SUBNET_OCID --display-name rayshopee-vm --image-id IMAGE_OCID --shape "VM.Standard.E2.1.Micro" --assign-public-ip true --wait-for-state RUNNING

# 8. Associar IP público à VM
oci network public-ip update --public-ip-id PUBLIC_IP_OCID --private-ip-id VNIC_OCID
```

### Instalar Backend na VM

```bash
# Conectar
ssh opc@64.181.161.232

# Node.js
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install --lts

# Projeto
git clone https://github.com/danieldaltio/rayshopee.git
cd rayshopee
cp .env.example .env
# Configurar .env com credenciais Supabase e Shopee

# Rodar
npm install
PORT=3003 npm run dev:server &
```

### Comandos Úteis Oracle Cloud

```bash
# Listar VMs
oci compute instance list --compartment-id OCID

# Pegar IP
oci compute instance get --instance-id INSTANCE_OCID

# Status VM
oci compute instance get --instance-id INSTANCE_OCID --query 'data."lifecycle-state"'

# Reiniciar VM
oci compute instance action --instance-id INSTANCE_OCID --action STOP
oci compute instance action --instance-id INSTANCE_OCID --action START

# Verificar IPs
oci compute instance list-vnics --instance-id INSTANCE_OCID

# Deletar VM (se preciso)
oci compute instance terminate --instance-id INSTANCE_OCID --preserve-boot-volume false
```

---

## 📱 Android App

### Configuração de Build
- **Arquivo**: `RayShopeeAndroid/app/build.gradle.kts`
- **SDK**: compileSdk 35, minSdk 26, targetSdk 35
- **JDK**: 25
- **AGP**: 9.0.0
- **Gradle**: 9.5.0

### URL da API (Production)
- **Arquivo**: `ProductRepositoryImpl.kt`
- **URL Base**: `http://64.181.161.232:3003`
- **Scanner**: `ScannerScreen.kt`

### Buildar APK

```bash
cd RayShopeeAndroid
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Servir APK

```bash
# No server (Oracle ou local)
cd RayShopeeAndroid/app/build/outputs/apk/debug
npx serve -l 3003
# Acesse: http://64.181.161.232:3003/app-debug.apk
```

---

## 🔧 Problemas Conhecidos e Soluções

### 1. LocalTunnel (Alternative)
- URL fixa: `https://rayshopee.loca.lt`
- Problema: Erro 511 (página de aviso)
- Solução: Header `bypass-tunnel-reminder: true`

### 2. Cloudflare Quick Tunnel
- URL muda a cada restart
- Não recomendado para produção

### 3. Oracle sem IP público
- Criar Reserved Public IP e associar à VM
- Problema comum: subnet privada

### 4. Shape A1.Flex indisponível
- Região sem capacidade
- Solução: Usar E2.1.Micro (Always Free)

---

## 📦 Credenciais e Variáveis

### .env (Backend)
```
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
SHOPEE_PARTNER_ID=...
SHOPEE_API_KEY=...
SHOPEE_SHOP_ID=...
```

### credenciais.json (Opcional)
- Location: `C:\Users\ThinkPad\.credentials\`

---

## 📁 Estrutura de Arquivos Importantes

```
RayShopee/
├── .env                          # Credenciais (NÃO COMMITAR)
├── .gitignore
├── package.json
├── server/
│   └── index.js                  # Backend principal
├── RayShopeeAndroid/
│   ├── app/
│   │   ├── build.gradle.kts      # Config build Android
│   │   └── src/main/java/
│   │       └── com/rayshopee/app/
│   │           ├── data/repository/
│   │           │   └── ProductRepositoryImpl.kt  # URL API
│   │           └── ui/screens/
│   │               └── ScannerScreen.kt         # Scanner + URL
│   └── gradle/
│       └── libs.versions.toml    # Versões dependências
├── rayshopee-mobile/           # (IGNORAR - nested git)
└── mobile-app/                # (IGNORAR - inválido)
```

---

## 🚀 Quick Start

### Setup Novo Desenvolvedor

```bash
# 1. Clone
git clone https://github.com/danieldaltio/rayshopee.git
cd rayshopee

# 2. Backend
cp .env.example .env
# Editar .env com credenciais
npm install
npm run dev:server

# 3. Android
cd RayShopeeAndroid
./gradlew assembleDebug
# Instalar APK em: app/build/outputs/apk/debug/app-debug.apk
```

### Conectar Oracle Cloud

```bash
ssh opc@64.181.161.232
cd rayshopee
PORT=3003 npm run dev:server &
```

---

## 📊 APIs Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|----------|
| GET | /api/health | Status servidor |
| GET | /api/products/barcode?barcode=XXX | Buscar por código |
| GET | /api/products/item/XXX | Buscar por ID |
| POST | /api/products/update-price | Atualizar preço |
| POST | /api/products/update-stock | Atualizar estoque |

---

## 🆘 Troubleshooting

```bash
# Verificar se backend está rodando
curl http://localhost:3003/api/health

# Ver processos Node
ps aux | grep node

# Ver logs
tail -f ~/rayshopee/server/logs/*.log

# Reiniciar backend
pkill -f "node server"
cd ~/rayshopee && PORT=3003 npm run dev:server &
```

---

## 📅 Criado: 2026-05-02
## ✍️ Autor: opencode + danieldaltio
## 🔗 Repo: https://github.com/danieldaltio/rayshopee