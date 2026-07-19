# run-jvm-tests.ps1
# Roda os testes JVM puros do PedidosEditProduto sem precisar de Gradle.
#
# Pré-requisitos (uma vez só):
#   - JDK 17+  (ja temos: Eclipse Adoptium JDK 25.0.3)
#   - kotlinc  (ja temos: em "C:\Program Files\Android\Android Studio\plugins\Kotlin\kotlinc\bin\kotlinc.bat")
#   - JARs em C:\Users\ThinkPad\junit-libs\ :
#       junit-4.13.2.jar
#       hamcrest-core-1.3.jar
#       json-20240303.jar
#     (Baixados de https://repo1.maven.org/maven2/ — ver bloco "Bootstrap" abaixo)
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\run-jvm-tests.ps1
#
# Saída esperada:
#   ................
#   Time: X,XXX
#   OK (36 tests)

param(
    [string]$JunitLibsDir = "C:\Users\ThinkPad\junit-libs",
    [string]$OutDir = "C:\Users\ThinkPad\test-run",
    [string]$AppRoot = "C:\Ubuntu\root\Projeto-OpenClaw-Docker\rayshopee-organize\apps\PedidosEditProduto"
)

$ErrorActionPreference = "Stop"

# Caminho do Kotlin (vem com Android Studio)
$kotlinHome = "C:\Program Files\Android\Android Studio\plugins\Kotlin\kotlinc"
$STDLIB = "$kotlinHome\lib\kotlin-stdlib.jar"
$KOTLINC = "$kotlinHome\bin\kotlinc.bat"

# Java
$JAVA_HOME_ = "C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot"
$JAVA = "$JAVA_HOME_\bin\java.exe"

# Validar pré-requisitos
foreach ($p in @($KOTLINC, $STDLIB, $JAVA, "$JunitLibsDir\junit-4.13.2.jar", "$JunitLibsDir\hamcrest-core-1.3.jar", "$JunitLibsDir\json-20240303.jar")) {
    if (-not (Test-Path $p)) {
        Write-Host "FALTA: $p" -ForegroundColor Red
        Write-Host ""
        Write-Host "Bootstrap necessario:" -ForegroundColor Yellow
        Write-Host "  mkdir $JunitLibsDir"
        Write-Host "  Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar' -OutFile '$JunitLibsDir\junit-4.13.2.jar'"
        Write-Host "  Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar' -OutFile '$JunitLibsDir\hamcrest-core-1.3.jar'"
        Write-Host "  Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/json/json/20240303/json-20240303.jar' -OutFile '$JunitLibsDir\json-20240303.jar'"
        exit 1
    }
}

# Limpa build anterior
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Path "$OutDir\main-classes" -Force | Out-Null
New-Item -ItemType Directory -Path "$OutDir\test-classes" -Force | Out-Null

Write-Host "=== Compilando producao ===" -ForegroundColor Cyan
& $KOTLINC -jvm-target 17 -d "$OutDir\main-classes" `
    -classpath "$STDLIB;$JunitLibsDir\json-20240303.jar" `
    "$AppRoot\app\src\main\java\com\rayshopee\app\util\ProfitCalculator.kt" `
    "$AppRoot\app\src\main\java\com\rayshopee\app\orders\OrdersResponseParser.kt" `
    "$AppRoot\app\src\main\java\com\rayshopee\app\products\ProductResponseParser.kt" `
    2>&1 | Select-Object -First 5
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO na compilacao da producao" -ForegroundColor Red; exit 1 }

Write-Host "=== Compilando testes ===" -ForegroundColor Cyan
& $KOTLINC -jvm-target 17 -d "$OutDir\test-classes" `
    -classpath "$OutDir\main-classes;$STDLIB;$JunitLibsDir\junit-4.13.2.jar;$JunitLibsDir\hamcrest-core-1.3.jar;$JunitLibsDir\json-20240303.jar" `
    "$AppRoot\app\src\test\java\com\rayshopee\app\util\ProfitCalculatorTest.kt" `
    "$AppRoot\app\src\test\java\com\rayshopee\app\orders\OrdersResponseParserTest.kt" `
    "$AppRoot\app\src\test\java\com\rayshopee\app\products\ProductResponseParserTest.kt" `
    2>&1 | Select-Object -First 5
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO na compilacao dos testes" -ForegroundColor Red; exit 1 }

Write-Host "=== Rodando JUnit ===" -ForegroundColor Cyan
& $JAVA `
    -cp "$OutDir\main-classes;$OutDir\test-classes;$STDLIB;$JunitLibsDir\junit-4.13.2.jar;$JunitLibsDir\hamcrest-core-1.3.jar;$JunitLibsDir\json-20240303.jar" `
    org.junit.runner.JUnitCore `
    com.rayshopee.app.util.ProfitCalculatorTest `
    com.rayshopee.app.orders.OrdersResponseParserTest `
    com.rayshopee.app.products.ProductResponseParserTest

Write-Host ""
Write-Host "=== Concluido ===" -ForegroundColor Green