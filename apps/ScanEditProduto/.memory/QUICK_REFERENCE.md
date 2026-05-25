# 🤖 QUICK REFERENCE FOR AIs

## 🎯 Purpose

This guide helps AIs with limited context (like minimax 2.5, Claude 3 Haiku) quickly understand the RayShopeeAndroid project.

---

## ⚡ Key Facts (Read First)

- **Project:** RayShopeeAndroid
- **Status:** ✅ Production Ready
- **Priority:** 🔴 10/10 (Main Project)
- **Architecture:** MVVM
- **Language:** Kotlin
- **UI:** Jetpack Compose
- **Build:** ✅ Success (56s)
- **Tests:** ✅ 8/8 Passing

---

## 📁 Important Files

### Core Files
1. `MainActivity.kt` - Entry point, ViewModel injection
2. `ScannerScreen.kt` - Main UI (camera + scanner)
3. `ScannerViewModel.kt` - Business logic
4. `ProductRepository.kt` - Data abstraction
5. `ProductRepositoryImpl.kt` - Implementation

### Documentation
- `README.md` - Full documentation
- `.memory/CONTEXT.md` - Complete context
- `.memory/ARCHITECTURE.md` - Architecture details
- `.memory/API_REFERENCE.md` - API docs

---

## 🏗️ Architecture Summary

```
UI (ScannerScreen)
    ↓ observes
ViewModel (ScannerViewModel)
    ↓ uses
Repository (ProductRepository)
    ├── Reads: Supabase REST
    └── Writes: Shopee API
```

### Layers

1. **UI Layer** - Jetpack Compose
   - ScannerScreen.kt
   - Observes ViewModel StateFlow
   - Dispatches Intents

2. **ViewModel Layer** - Android ViewModel
   - ScannerViewModel.kt
   - Holds ScannerUiState
   - Processes Intents
   - Business logic

3. **Repository Layer** - Abstraction
   - ProductRepository.kt (interface)
   - ProductRepositoryImpl.kt (implementation)
   - Single source of truth

4. **Data Sources**
   - Supabase (read - fast, no auth)
   - Shopee API (write - secure, OAuth)

---

## 🔑 Key Concepts

### State Management

```kotlin
data class ScannerUiState(
    val isLoading: Boolean = false,
    val product: Product? = null,
    val error: String? = null,
    val lastScannedBarcode: String? = null,
    val isUpdating: Boolean = false
)
```

- StateFlow for reactive updates
- UI observes and recomposes automatically

### Intents (Actions)

```kotlin
sealed interface ScannerIntent {
    data class BarcodeScanned(val barcode: String) : ScannerIntent
    data class ItemIdSearch(val itemId: String) : ScannerIntent
    data class UpdatePrice(val variationId: String, val price: Double) : ScannerIntent
    data class UpdateStock(val variationId: String, val stock: Int) : ScannerIntent
    data object ClearError : ScannerIntent
    data object ClearProduct : ScannerIntent
}
```

- UI dispatches intents
- ViewModel processes them
- State updates accordingly

### Data Flow

```
Event → Intent → ViewModel → Repository → API → Result → State → UI
```

---

## 💰 Financial Calculations

### Formula

```kotlin
fun calculateProfit(price: Double, cost: Double): Pair<Double, Double> {
    // profit = revenue - cost - commission - taxes
    // margin = (profit / revenue) * 100
}
```

### Taxes

- Government: 6%
- Transaction: 2%
- Total: 8%

### Commission (Escalonada)

| Min Price | Commission | Fixed Fee | PIX Subsidy |
|-----------|-----------|-----------|-------------|
| R$ 0 | 0.25% | R$ 4.00 | 0% |
| R$ 12 | 0.20% | R$ 4.00 | 0% |
| R$ 80 | 0.14% | R$ 16.00 | 1% |
| R$ 100 | 0.14% | R$ 16.00 | 1% |
| R$ 150 | 0.12% | R$ 22.00 | 1% |
| R$ 300 | 0.10% | R$ 36.00 | 2% |
| R$ 500 | 0.08% | R$ 46.00 | 2% |

---

## 🔧 Configuration

### BuildConfig

Auto-generated fields:

```java
BuildConfig.SUPABASE_BASE_URL        // https://xcvazbfjkiddzlxwynni.supabase.co
BuildConfig.SHOPEE_API_BASE_URL      // https://rayshopeeapi-8ivucqzy.b4a.run
BuildConfig.APPLICATION_ID           // com.rayshopee.app
BuildConfig.VERSION_CODE             // 2
BuildConfig.VERSION_NAME             // 1.0.1
BuildConfig.DEBUG                    // true/false
```

### Environment Variables

```bash
# .env (not committed)
SUPABASE_API_KEY=sb_publishable_...
SHOPEE_PARTNER_ID=...
SHOPEE_PARTNER_KEY=...
SHOPEE_ACCESS_TOKEN=...
SHOPEE_REFRESH_TOKEN=...
```

---

## 🧪 Testing

### Run Tests

```bash
./gradlew testDebugUnitTest
```

### Test Results

```
✅ 8/8 tests passing
⏱️  <10 seconds
📊 ~60% coverage (ViewModel)
```

### Test Files

- `ScannerViewModelTest.kt` - All ViewModel tests

---

## 🚀 Build & Deploy

### Build Commands

```bash
# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease

# App Bundle (Play Store)
./gradlew bundleRelease
```

### Deploy to Play Store

1. Build bundle: `./gradlew bundleRelease`
2. Upload `app-release.aab` to Play Console
3. Configure track (internal/closed/open/production)
4. Publish

---

## 🔍 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| BuildConfig not found | `./gradlew clean` + rebuild |
| API 401 error | Renew OAuth token |
| Scanner not working | Check camera permission |
| ProGuard errors | Add rules to proguard-rules.pro |

### Logs

```kotlin
// Use for debugging
Log.d("RayShopee", "message")

// Remove in production
if (BuildConfig.DEBUG) {
    Log.d("RayShopee", "debug info")
}
```

---

## 📊 Performance

### Response Times

| Operation | Time |
|-----------|------|
| Supabase read | ~200ms |
| Shopee API read | ~500ms |
| Shopee API write | ~800ms |
| Scanner detection | <500ms |

### Build Metrics

| Metric | Value |
|--------|-------|
| Build time | 56s |
| APK size (debug) | ~25MB |
| Compilation errors | 0 |
| Warnings | 4 (non-blocking) |

---

## 🎯 Quick Start for New Devs

### 1. Setup

```bash
# Clone repo
git clone <repo>
cd RayShopeeAndroid

# Open in Android Studio
# Sync Gradle
```

### 2. Run

```bash
# Build and run
./gradlew assembleDebug

# Or click ▶️ in Android Studio
```

### 3. Test

```bash
# Run tests
./gradlew testDebugUnitTest

# View results
open app/build/reports/tests/testDebugUnitTest/index.html
```

### 4. Code

```kotlin
// Add feature in ViewModel
fun newFeature() {
    viewModelScope.launch {
        // Business logic
        _uiState.value = newState
    }
}

// Observe in UI
val state by viewModel.uiState.collectAsState()
```

---

## 📚 Learn More

### Documentation

- **Full docs:** README.md
- **Architecture:** .memory/ARCHITECTURE.md
- **APIs:** .memory/API_REFERENCE.md
- **Tests:** .memory/TEST_GUIDE.md
- **Deploy:** .memory/DEPLOYMENT.md
- **Decisions:** .memory/DECISIONS.md

### Key Files

```
RayShopeeAndroid/
├── README.md                    # Start here
├── .memory/
│   ├── ARCHITECTURE.md          # Architecture deep dive
│   ├── API_REFERENCE.md         # All APIs documented
│   ├── TEST_GUIDE.md            # Testing guide
│   ├── DEPLOYMENT.md            # Deploy process
│   ├── DECISIONS.md             # Technical decisions
│   └── CONTEXT.md               # Complete context
└── app/src/main/
    ├── MainActivity.kt          # Entry point
    └── ui/screens/
        ├── ScannerScreen.kt      # Main UI
        └── ScannerViewModel.kt   # Business logic
```

---

## ❓ FAQ

**Q: What's the main architecture?**  
A: MVVM with Jetpack Compose

**Q: How to run tests?**  
A: `./gradlew testDebugUnitTest`

**Q: Where are the APIs documented?**  
A: `.memory/API_REFERENCE.md`

**Q: How to build for production?**  
A: `./gradlew bundleRelease`

**Q: Where is the business logic?**  
A: `ScannerViewModel.kt`

---

## 🚨 Important Notes

### Security

⚠️ **API keys are hardcoded**  
- SUPABASE_API_KEY in ScannerScreen.kt
- Needs Android Keystore for production

### Testing

✅ **Tests cover ViewModel**  
- 8 unit tests passing
- Repository not tested yet
- UI tests pending

### Production

⚠️ **Not fully production-ready**  
- Debug keystore in use
- Needs release keystore
- ProGuard configured but needs testing

---

## 🎯 Summary

### What You Need to Know

1. **Architecture:** MVVM (ViewModel + StateFlow + Compose)
2. **Main Screen:** ScannerScreen (camera + barcode scanner)
3. **Business Logic:** ScannerViewModel (processes intents)
4. **Data:** Repository (Supabase read, Shopee API write)
5. **Tests:** 8 unit tests (all passing)
6. **Build:** Working (56s)

### What to Read

- **Quick overview:** This file
- **Full context:** `.memory/CONTEXT.md`
- **Architecture:** `.memory/ARCHITECTURE.md`
- **APIs:** `.memory/API_REFERENCE.md`

### What to Do

- **Run app:** `./gradlew assembleDebug`
- **Run tests:** `./gradlew testDebugUnitTest`
- **Read code:** Start with `ScannerScreen.kt`
- **Add feature:** Add intent → ViewModel → UI

---

## 🏁 Ready to Code!

You now have enough context to:
- ✅ Understand the architecture
- ✅ Run the app
- ✅ Run tests
- ✅ Add features
- ✅ Fix bugs

**Happy coding! 🚀**

---

**Last Updated:** 05/05/2026  
**Version:** 1.0  
**For:** AIs with limited context (minimax 2.5, Claude 3 Haiku, etc.)

--- END OF QUICK REFERENCE ---