# Guia de Desenvolvimento Android 2026
## RayShopeeMobile - Melhores Práticas

---

## 1. Ambiente de Desenvolvimento

### Ferramentas Obrigatórias
| Ferramenta | Versão | Observação |
|-----------|--------|------------|
| Android Studio | 2025.x | Mais recente |
| Java | 25 LTS | JDK Adoptium/Eclipse |
| Gradle | 9.5.0 | Wrapper do projeto |
| Kotlin | 2.3.20 | Mais recente |
| Android SDK | 36 | Compile/Target |
| Node.js | 20.19+ | Para ExpoSDK |

### Setup Inicial
```bash
# Instalar Java 25
# Baixar de https://adoptium.net/

# Configurar variáveis de ambiente
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-25.0.3.9-hotspot"
export ANDROID_HOME="C:/Android/sdk"
export PATH=$PATH:$JAVA_HOME/bin
```

---

## 2. Projeto com Expo SDK 55

### Criar Projeto
```bash
npx create-expo-app@latest RayShopeeMobile --template blank-typescript
cd RayShopeeMobile

# Atualizar para Expo SDK 55
npm install expo@~55.0.0 expo-router@~6.0.0
```

### Estrutura de Diretórios (Clean Architecture)
```
src/
├── domain/           # Regras de negócio
│   ├── entities/     # Modelos de dados
│   └── repositories/ # Interfaces
├── data/             # Implementações
│   ├── api/          # clients HTTP
│   └── repositories/ # Implementações
├── presentation/     # UI
│   ├── hooks/        # Custom hooks React
│   ├── components/   # Componentes compartilhados
│   └── screens/      # Telas
└── di/               # Injeção de dependências
```

---

## 3. Kotlin 2.3.20 + build.gradle

### Configuração do build.gradle (raiz)
```groovy
// build.gradle - root
buildscript {
    ext {
        kotlinVersion = "2.3.20"
        compileSdkVersion = 36
        minSdkVersion = 24
    }
    
    repositories {
        google()
        mavenCentral()
    }
    
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// Configurar Kotlin em todos os módulos
subprojects {
    afterEvaluate { project ->
        if (project.plugins.hasPlugin('org.jetbrains.kotlin.android')) {
            project.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
                compilerOptions {
                    jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_25)
                }
            }
        }
    }
}
```

### Configuração do app/build.gradle
```groovy
// app/build.gradle
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    defaultConfig {
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_25
        targetCompatibility JavaVersion.VERSION_25
    }
    
    kotlinOptions {
        jvmTarget = "25"
    }
}
```

---

## 4. Jetpack Compose (Se Migrar de XML)

### Exemplo de Composable
```kotlin
@Composable
fun VariationCard(
    variation: Variation,
    onPriceChange: (Int) -> Unit,
    onStockChange: (Int) -> Unit
) {
    var priceText by remember(variation.price) { 
        mutableStateOf((variation.price / 100000).toString()) 
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (variation.dirty) 
                MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.surface
        )
    ) {
        Column(modifier = Modifier.padding(16)) {
            Text(
                text = variation.name,
                style = MaterialTheme.typography.titleMedium
            )
            
            OutlinedTextField(
                value = priceText,
                onValueChange = { text ->
                    priceText = text
                    text.toDoubleOrNull()?.let { price ->
                        onPriceChange((price * 100000).toInt())
                    }
                },
                label = { Text("Preço") },
                prefix = { Text("R$ ") },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Decimal
                )
            )
        }
    }
}
```

---

## 5. Arquitetura MVI

### Model
```kotlin
data class ProductEditorState(
    val isLoading: Boolean = false,
    val product: Product? = null,
    val error: String? = null,
    val successMessage: String? = null
)
```

### Intent (Ações do Usuário)
```kotlin
sealed class ProductEditorIntent {
    data class SearchBySku(val sku: String) : ProductEditorIntent()
    data class UpdatePrice(val modelId: Int, val price: Int) : ProductEditorIntent()
    data class UpdateStock(val modelId: Int, val stock: Int) : ProductEditorIntent()
    object SubmitChanges : ProductEditorIntent()
    object ClearError : ProductEditorIntent()
}
```

### ViewModel (Reducer)
```kotlin
class ProductEditorViewModel(
    private val repository: ProductRepository
) : ViewModel() {
    
    private val _state = mutableStateOf(ProductEditorState())
    val state: StateFlow<ProductEditorState> = _state.asStateFlow()
    
    fun processIntent(intent: ProductEditorIntent) {
        when (intent) {
            is ProductEditorIntent.SearchBySku -> searchProduct(intent.sku)
            is ProductEditorIntent.UpdatePrice -> updatePrice(intent.modelId, intent.price)
            is ProductEditorIntent.SubmitChanges -> submitChanges()
            // ... outros casos
        }
    }
}
```

---

## 6. Android 16 - Features Obrigatórias

### Edge-to-edge (Tela Cheia)
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Habilita edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        setContent {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .systemBarsPadding()
            ) {
                // Seu app aqui
            }
        }
    }
}
```

### Predictive Back Gesture
```kotlin
// Disponível automaticamente no Android 16+
// Para garantir suporte:
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyScreen() {
    val navController = rememberNavController()
    
    // Animações de volta automaticamente habilitadas
    NavHost(navController = navController, startDestination = "home") {
        // ...
    }
}
```

### Photo Picker (Seletor de Fotos Nativo)
```kotlin
import android.net.Uri

fun launchPhotoPicker() {
    val picker = androidx.activity.result.PickVisualMediaContract()
    photoPickerLauncher.launch(picker)
}
```

### Live Updates (Notificações de Progresso)
```kotlin
// Para notificações de rastreamento
NotificationChannel.Builder(context, CHANNEL_ID)
    .setImportance(NotificationManager.IMPORTANCE_HIGH)
    .setStyle(NotificationCompat.BigTextStyle())
    .build()
```

---

## 7. Performance - Melhores Práticas

### useMemo e remember
```kotlin
@Composable
fun ProductList(products: List<Product>) {
    // Para dados pequenos - use remember
    val sortedProducts = remember(products) {
        products.sortedBy { it.name }
    }
    
    // Para cálculos pesados - use rememberSaveable
    val groupedProducts = rememberSaveable(products) {
        products.groupBy { it.category }
    }
}
```

### Lazy Lists com Keys
```kotlin
LazyColumn {
    items(
        items = products,
        key = { it.id }  // CRÍTICO para performance
    ) { product ->
        ProductItem(product = product)
    }
}
```

### Baseline Profiles
```groovy
// app/build.gradle
buildTypes {
    release {
        // Gera baseline profile automaticamente
        isMinifyEnabled = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

### Executar testes de performance:
```bash
./gradlew benchmark
```

---

## 8. Dependency Injection (Koin)

### Setup
```kotlin
// di/AppModule.kt
val appModule = module {
    single { ProductRepository(get()) }
    factory { ProductEditorViewModel(get()) }
}

@Composable
fun App() {
    KoinAndroidContext(moduleList = appModule) {
        // seu app
    }
}
```

---

## 9. Build eRelease

### Variáveis de Ambiente
```bash
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-25.0.3.9-hotspot"
export ANDROID_HOME="C:/Android/sdk"
export PATH=$PATH:$JAVA_HOME/bin
```

### Build Debug
```bash
cd android
./gradlew assembleDebug
```

### Build Release
```bash
./gradlew assembleRelease
```

###Assinatura
```bash
keytool -genkey -v -keystore app/release.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

---

## 10. Checklist de Qualidade

- [ ] Kotlin 2.3.20 configurado
- [ ] Edge-to-edge implementado
- [ ] Predictive back gesture funcional
- [ ] Lazy lists com keys
- [ ] Baseline profiles gerados
- [ ] Koin/Koin configurado
- [ ] Testes unitários > 80%
- [ ] APKs de debug/release funcionando

---

*Atualizado: 30/04/2026*  
*Baseado nas melhores práticas Android 2026*