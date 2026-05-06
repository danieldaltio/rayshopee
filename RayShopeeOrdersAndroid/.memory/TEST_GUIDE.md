# 🧪 Guia de Testes - RayShopeeAndroid

## 📋 Visão Geral

Este documento descreve a estratégia de testes do RayShopeeAndroid, incluindo testes unitários, diretrizes e melhores práticas.

---

## 🎯 Estratégia de Testes

### Pirâmide de Testes

```
        UI Tests (0)
          /
    Integration (0)
        /
   Unit Tests (8) ✅
        /
   Static Analysis
```

### Cobertura Atual

| Tipo | Quantidade | Status |
|------|-----------|--------|
| Unit Tests | 8 | ✅ Passing |
| Integration Tests | 0 | 🟡 Planejado |
| UI Tests | 0 | 🟡 Planejado |
| Static Analysis | 1 | ✅ Passing |

---

## 🧰 Stack de Testes

### Dependências

```kotlin
// build.gradle.kts
testImplementation(libs.junit)                    // 4.13.2
testImplementation(libs.kotlinx.coroutines.test)  // 1.9.0
testImplementation(libs.mockk)                    // 1.13.10
testImplementation(libs.arch.core.testing)        // 2.2.0
testImplementation(libs.turbine)                  // 1.0.0
```

### Ferramentas

- **JUnit 4:** Framework de testes
- **MockK:** Mocking library
- **Kotlin Coroutines Test:** Testes assíncronos
- **AndroidX Arch Core Testing:** Testes de arquitetura
- **Turbine:** Testes de Flow

---

## 📁 Estrutura de Testes

```
app/src/test/java/com/rayshopee/app/
└── ui/
    └── screens/
        └── ScannerViewModelTest.kt    # 8 testes

app/src/androidTest/java/com/rayshopee/app/
    └── (vazio - testes de UI futuros)
```

---

## 🧪 Testes Unitários

### ScannerViewModelTest.kt

#### Testes Implementados

| # | Teste | Descrição | Status |
|---|-------|-----------|--------|
| 1 | `initial state should be correct` | Verifica estado inicial | ✅ |
| 2 | `BarcodeScanned - sucesso` | Busca com sucesso | ✅ |
| 3 | `BarcodeScanned - erro` | Busca com erro | ✅ |
| 4 | `ItemIdSearch - sucesso` | Busca por ID | ✅ |
| 5 | `UpdatePrice - sucesso` | Atualiza preço | ✅ |
| 6 | `UpdatePrice - erro` | Erro ao atualizar preço | ✅ |
| 7 | `UpdateStock - sucesso` | Atualiza estoque | ✅ |
| 8 | `ClearError` | Limpa erro | ✅ |
| 9 | `ClearProduct` | Limpa produto | ✅ |

---

## 📖 Guia de Criação de Testes

### Padrão Gherkin (Given-When-Then)

```kotlin
@Test
fun `nome do teste`() = runTest {
    // Given (Dado que)
    val mockData = createMockData()
    coEvery { repository.someCall() } returns Result.success(mockData)

    // When (Quando)
    viewModel.processIntent(SomeIntent(mockData))
    testDispatcher.scheduler.advanceUntilIdle()

    // Then (Então)
    val uiState = viewModel.uiState.value
    assertEquals(expected, uiState.actual)
    coVerify { repository.someCall() }
}
```

### Exemplo Completo

```kotlin
@Test
fun `processIntent BarcodeScanned should update loading state and fetch product`() = runTest {
    // Given
    val barcode = "1234567890123"
    val product = Product(
        itemId = "ITEM001",
        itemName = "Test Product",
        variations = listOf(
            ProductVariation("VAR001", "Variation 1", 100.0, 10)
        )
    )
    coEvery { mockRepository.searchByBarcode(barcode) } returns Result.success(product)

    // When
    viewModel.processIntent(ScannerIntent.BarcodeScanned(barcode))
    testDispatcher.scheduler.advanceUntilIdle()

    // Then
    val uiState = viewModel.uiState.value
    assertFalse(uiState.isLoading)
    assertEquals(product, uiState.product)
    assertNull(uiState.error)
    coVerify { mockRepository.searchByBarcode(barcode) }
}
```

---

## 🔧 Mocking com MockK

### Conceitos Básicos

```kotlin
// Criar mock
@MockK
private lateinit var mockRepository: ProductRepository

// Inicializar mocks
MockKAnnotations.init(this)

// Configurar comportamento
coEvery { mockRepository.searchByBarcode(any()) } returns Result.success(product)

// Verificar chamadas
coVerify { mockRepository.searchByBarcode(barcode) }

// Verificar chamadas exatas
coVerify(exactly = 1) { mockRepository.searchByBarcode(barcode) }

// Verificar nenhuma chamada
coVerify(exactly = 0) { mockRepository.someCall() }
```

### Mocks Comuns

```kotlin
// Sucesso
coEvery { repository.call() } returns Result.success(data)

// Falha
coEvery { repository.call() } returns Result.failure(Exception("error"))

// Lançar exceção
coEvery { repository.call() } throws RuntimeException("error")

// Resposta sequencial
coEvery { repository.call() } returnsMany listOf(
    Result.success(data1),
    Result.failure(error),
    Result.success(data2)
)
```

---

## ⚡ Testes Assíncronos

### Usando TestDispatcher

```kotlin
private val testDispatcher = StandardTestDispatcher()

@Before
fun setup() {
    Dispatchers.setMain(testDispatcher)
}

@After
fun tearDown() {
    Dispatchers.resetMain()
}

@Test
fun `async test`() = runTest {
    // Código assíncrono
    viewModel.processIntent(intent)
    
    // Avançar até idle
    testDispatcher.scheduler.advanceUntilIdle()
    
    // Verificações
    val uiState = viewModel.uiState.value
    // ...
}
```

### Turbine para Flows

```kotlin
viewModel.uiState
    .test {
        val firstState = awaitItem()
        assertEquals(expected, firstState)
        
        viewModel.processIntent(intent)
        
        val secondState = awaitItem()
        assertEquals(expected2, secondState)
        
        cancelAndIgnoreRemainingEvents()
    }
```

---

## 📊 Boas Práticas

### ✅ Fazer

1. **Nomes descritivos**
   ```kotlin
   // Bom
   `processIntent BarcodeScanned should fetch product`
   
   // Ruim
   `test1`
   ```

2. **One assertion per test** (quando possível)
   ```kotlin
   // Foco em um comportamento
   assertEquals(expected, actual)
   ```

3. **Testar comportamento, não implementação**
   ```kotlin
   // Testar o que acontece, não como
   verify(uiState.product == expected)
   ```

4. **Given-When-Then**
   ```kotlin
   // Estrutura clara
   // Given
   // When
   // Then
   ```

5. **Cobertura de casos**
   ```kotlin
   // Sucesso
   // Erro
   // Edge cases
   ```

### ❌ Não Fazer

1. **Testes dependentes**
   ```kotlin
   // Ruim: test2 depende de test1
   fun test1() { /* ... */ }
   fun test2() { /* depende de test1 */ }
   ```

2. **Lógica complexa nos testes**
   ```kotlin
   // Ruim: teste com if/else
   if (condition) {
       // ...
   }
   ```

3. **Testar múltiplas coisas**
   ```kotlin
   // Ruim: verificar 5 coisas diferentes
   assertEquals(a, b)
   assertEquals(c, d)
   // ...
   ```

4. **Ignorar testes**
   ```kotlin
   // Ruim: @Ignore
   @Ignore("fix later")
   ```

---

## 🎭 Test Doubles

### Tipos

| Tipo | Uso | Exemplo |
|------|-----|---------|
| **Mock** | Verificar interações | `MockK` |
| **Stub** | Retornar dados | `coEvery { ... } returns` |
| **Fake** | Implementação leve | `FakeRepository` |
| **Spy** | Partial mock | `spyk(realObject)` |

### Quando Usar

```kotlin
// Mock: verificar interações
val mock = mockk<Repository>()
coEvery { mock.call() } returns result

// Stub: retornar dados
val stub = object : Repository {
    override fun call() = result
}

// Fake: implementação testável
class FakeRepository : Repository {
    var shouldFail = false
    override fun call() = if (shouldFail) error else result
}
```

---

## 📈 Métricas de Teste

### Objetivos

| Métrica | Meta Atual | Meta Futura |
|---------|-----------|-------------|
| Cobertura | 60% | 80% |
| Testes Unitários | 8 | 20+ |
| Testes Integration | 0 | 10+ |
| Testes UI | 0 | 15+ |
| Build Time | < 60s | < 45s |

### Monitoramento

```bash
# Rodar testes
./gradlew testDebugUnitTest

# Ver cobertura (quando configurado)
./gradlew jacocoTestReport

# Ver resultados
open app/build/reports/tests/testDebugUnitTest/index.html
```

---

## 🔄 CI/CD Integration

### GitHub Actions (Futuro)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: ./gradlew testDebugUnitTest
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 📚 Recursos

### Documentação

- [JUnit 4](https://junit.org/junit4/)
- [MockK](https://mockk.io/)
- [Kotlin Coroutines Test](https://kotlinlang.org/docs/coroutines-test.html)
- [Android Testing](https://developer.android.com/training/testing)

### Exemplos

- [Android Samples](https://github.com/android/testing-samples)
- [Kotlin Coroutines Test](https://github.com/Kotlin/kotlinx.coroutines/tree/master/kotlinx-coroutines-test)

---

## ❓ FAQ

### Por que MockK em vez de Mockito?
- Melhor suporte a Kotlin
- Coroutines built-in
- DSL mais expressiva

### Por que 8 testes é suficiente?
- Foco em ViewModel
- Cobertura de cenários principais
- Base para expansão

### Quando adicionar mais testes?
- Nova feature
- Bug fix
- Refatoração

---

## 🎯 Próximos Passos

### Sprint 2
- [ ] Testes de Repository
- [ ] Testes de integração
- [ ] Configurar Jacoco

### Sprint 3
- [ ] Testes UI (Espresso)
- [ ] Testes de performance
- [ ] Monkey testing

---

## 📝 Conclusão

A estratégia de testes atual fornece:
- ✅ Confiança nas mudanças
- ✅ Documentação executável
- ✅ Prevenção de regressões
- ✅ Base para expansão

**Manter testes simples, rápidos e confiáveis!** 🚀

---

**Última Atualização:** 05/05/2026  
**Versão:** 1.0  
**Manutenção:** Atualizar com novos testes