# OpenMemory Integration Guide

## Overview

The RayShopeeAndroid project now includes **OpenMemory** integration for persistent AI context management. This enables AI assistants with limited context windows (e.g., minimax 2.5, Claude 3 Haiku) to retain project knowledge across sessions.

## What is OpenMemory?

OpenMemory is a local-first, persistent memory engine that:
- ✅ Stores project context in SQLite (local-first)
- ✅ Provides semantic search over memories
- ✅ Supports embeddings for intelligent retrieval
- ✅ Works offline (no cloud required)
- ✅ Integrates with LangChain and other AI frameworks

## Quick Start

### Using the Memory Service

```python
from memory_service import RayShopeeMemory

# Initialize
mem = RayShopeeMemory(user_id="my-assistant")

# Add a memory
await mem.add(
    "User prefers dark mode in the UI",
    tags=["ui", "preference", "dark-mode"],
    category="user-preferences"
)

# Search memories
results = await mem.search("dark mode", limit=5)
for r in results:
    print(r["content"])

# Get recent memories
history = await mem.history(limit=10)

# Add architecture decision
await mem.add_architecture_decision(
    decision="Use MVVM pattern",
    context="MVVM provides better testability and separation of concerns"
)

# Add code pattern
await mem.add_code_pattern(
    pattern="StateFlow for reactive state",
    description="Use StateFlow in ViewModel for lifecycle-aware state management"
)
```

### Using the CLI

```bash
# Add a memory
python memory_service.py --add "User likes to filter by price" --tags "ui,preference" --category user-preferences

# Search memories
python memory_service.py --search "preferences" --limit 10

# View recent memories
python memory_service.py --recent --limit 20

# Get summary
python memory_service.py --summary
```

## Configuration

Edit `.env.memory` to configure:

```bash
# Database (SQLite by default)
OM_DB_URL=sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite

# Memory tier: fast, smart, deep, hybrid
OM_TIER=smart

# Embedding provider: synthetic, openai, gemini, ollama, aws
OM_EMBEDDING_PROVIDER=synthetic

# Context limits
OM_MAX_CONTEXT_ITEMS=50
OM_MAX_CONTEXT_TOKENS=4096
```

## Database Location

The memory database is stored in:
```
RayShopeeAndroid/.memory/openmemory.sqlite
```

This file should be **committed to git** so all team members and AI sessions share the same context.

## Memory Categories

Use these categories to organize memories:

| Category | Purpose | Example |
|----------|---------|---------|
| `architecture` | Design decisions | MVVM pattern choice |
| `code_patterns` | Reusable code | StateFlow usage |
| `bug_fixes` | Bug resolutions | Scanner crash fix |
| `api_documentation` | API endpoints | Supabase queries |
| `test_results` | Test outcomes | ViewModel tests |
| `user_preferences` | User behaviors | Dark mode preference |
| `general` | Miscellaneous | Project notes |

## Integration with AI Assistants

### For Claude / ChatGPT

When asking questions, reference the memory:

```
"Check the project memory for architecture decisions about MVVM"
```

### For minimax 2.5 / Claude 3 Haiku

These models have limited context. The memory system helps by:
1. Storing important project facts
2. Retrieving relevant context on-demand
3. Summarizing long documents

### In Development Workflow

```python
# Before coding, check memory for existing patterns
results = await mem.search("repository pattern", category="architecture")

# After fixing a bug, document it
await mem.add_bug_fix(
    bug="Scanner crashes on null barcode",
    root_cause="Missing null check in ScannerViewModel",
    fix="Added null safety check before processing"
)

# After implementing a feature, document the pattern
await mem.add_code_pattern(
    pattern="Intent-based ViewModel",
    description="Use sealed interface for ViewModel intents"
)
```

## Best Practices

### ✅ Do

1. **Add important decisions**: Architecture choices, tech stack decisions
2. **Document patterns**: Reusable code patterns and idioms
3. **Record bug fixes**: Root causes and solutions
4. **Tag appropriately**: Use consistent tags for easy retrieval
5. **Use categories**: Organize memories by category
6. **Keep it concise**: Focus on key information

### ❌ Don't

1. **Store sensitive data**: API keys, passwords, secrets
2. **Add temporary notes**: Use regular notes for temporary info
3. **Duplicate existing docs**: Check memory before adding
4. **Over-categorize**: Use simple, consistent categories

## API Reference

### RayShopeeMemory Class

#### `add(content, tags=None, **kwargs)`
Add a memory entry.

**Parameters:**
- `content` (str): The content to store
- `tags` (list): Optional tags
- `**kwargs`: Additional metadata (category, meta, etc.)

**Returns:** Memory entry dict or None

#### `search(query, limit=10, **kwargs)`
Search memories.

**Parameters:**
- `query` (str): Search query
- `limit` (int): Max results
- `**kwargs`: Filters (category, etc.)

**Returns:** List of matching memories

#### `history(limit=20)`
Get recent memories.

**Parameters:**
- `limit` (int): Max entries

**Returns:** List of recent memories

#### `get(memory_id)`
Get specific memory.

**Parameters:**
- `memory_id` (str): Memory ID

**Returns:** Memory entry or None

#### `delete(memory_id)`
Delete a memory.

**Parameters:**
- `memory_id` (str): Memory ID

**Returns:** True if successful

#### `clear()`
Clear all memories for current user.

**Returns:** True if successful

#### Convenience Methods

- `add_architecture_decision(decision, context, **kwargs)`
- `add_code_pattern(pattern, description, **kwargs)`
- `add_bug_fix(bug, root_cause, fix, **kwargs)`
- `add_test_result(test_name, status, details, **kwargs)`
- `add_api_endpoint(endpoint, method, description, **kwargs)`

## Examples

### Example 1: Document Architecture Decision

```python
await mem.add_architecture_decision(
    decision="Use Hilt for Dependency Injection",
    context="Hilt is the official Android DI framework, reduces boilerplate, and integrates well with Jetpack Compose",
    alternatives=["Manual DI", "Koin", "Dagger"]
)
```

### Example 2: Record Code Pattern

```python
await mem.add_code_pattern(
    pattern="StateFlow + sealed interface for UI state",
    description="""
    Use StateFlow<UiState> in ViewModel where UiState is a data class.
    Use sealed interface for user intents/actions.
    
    Benefits:
    - Type-safe state management
    - Lifecycle-aware
    - Easy to test
    """
)
```

### Example 3: Document Bug Fix

```python
await mem.add_bug_fix(
    bug="ScannerViewModel crashes when barcode is null",
    root_cause="Missing null check before calling searchByBarcode()",
    fix="Added null safety check and error handling in processIntent()"
)
```

### Example 4: API Documentation

```python
await mem.add_api_endpoint(
    endpoint="/products/search",
    method="GET",
    description="""
    Search products by barcode or item ID.
    
    Query params:
    - barcode: String (optional)
    - itemId: String (optional)
    
    Returns: Product object with variations
    """
)
```

## Troubleshooting

### Memory not persisting

```bash
# Check database exists
ls -la RayShopeeAndroid/.memory/openmemory.sqlite

# Verify permissions
chmod 644 RayShopeeAndroid/.memory/openmemory.sqlite
```

### Search returns no results

```python
# Try broader search
results = await mem.search("pattern", limit=50)

# Check all memories
history = await mem.history(limit=100)
```

### Database locked

```bash
# Close other connections
# Don't open SQLite browser while app is running
```

---

## 🚀 QR Code Generation After Build

This section documents the automated QR code generation process for APK distribution after each build.

### Overview

After building the RayShopee Android APK, a QR code is automatically generated to facilitate easy installation on test devices. The QR code contains a URL pointing to the APK file served via a local HTTP server.

### Quick Start

#### One-Command Build & QR Code

```bash
# Build APK and generate QR code
./gradlew assembleDebug && python3 generate_qr.py
```

#### Full Process (with HTTP server)

```bash
# 1. Build the APK
./gradlew assembleDebug

# 2. Start HTTP server (in background)
python3 serve_apk.py &

# 3. Generate QR code
python3 generate_qr.py

# 4. Scan QR code with your phone and install
```

### Files Generated

| File | Description | Location |
|------|-------------|----------|
| `app-debug.apk` | The Android APK | `RayShopeeAndroid/app/build/outputs/apk/debug/` |
| `qrcode_rede.png` | QR code for download | Project root directory |
| `qrcode_download.html` | Web page with QR code | Project root directory |

### Scripts

#### generate_qr.py

Generates a QR code pointing to the APK download URL.

**Usage:**
```bash
python3 generate_qr.py
```

**Output:**
```
==================================================
QR Code Generated Successfully!
==================================================
File: qrcode_rede.png
URL: http://192.168.15.9:8080/app-debug.apk
Scan with your phone to download the APK
==================================================
```

**Features:**
- Automatically detects local IP address
- Generates scannable QR code
- Saves as PNG image
- Displays download URL

#### serve_apk.py

Starts a simple HTTP server to serve the APK file.

**Usage:**
```bash
python3 serve_apk.py
```

**Output:**
```
==================================================
RayShopee APK Server
==================================================
Serving files from: /path/to/apk/directory
URL: http://localhost:8080/app-debug.apk
==================================================
```

**Features:**
- Serves files from APK directory
- Runs on port 8080
- Accessible on local network
- Press Ctrl+C to stop

#### build_and_qr.sh (Optional)

Complete automated build script.

**Usage:**
```bash
chmod +x build_and_qr.sh
./build_and_qr.sh
```

**What it does:**
1. Builds the APK with Gradle
2. Starts HTTP server in background
3. Generates QR code
4. Displays installation instructions

### Installation on Android

#### Prerequisites

1. **Enable Unknown Sources:**
   - Settings → Security → Install unknown apps
   - Enable for your browser (Chrome, Firefox, etc.)
   - Or enable globally (varies by Android version)

2. **Connect to Same Network:**
   - Ensure phone and computer are on same Wi-Fi
   - Note the computer's IP address (shown in QR code)

#### Method 1: Scan QR Code (Recommended)

1. Run `python3 generate_qr.py`
2. Open `qrcode_rede.png` on your computer
3. Scan with phone's camera or QR scanner app
4. Tap the download link
5. Install the APK

#### Method 2: Direct Download

1. Start HTTP server: `python3 serve_apk.py`
2. On phone, open browser
3. Visit: `http://[COMPUTER_IP]:8080/app-debug.apk`
   - Example: `http://192.168.15.9:8080/app-debug.apk`
4. Download and install

#### Method 3: Manual Transfer

1. Copy `app-debug.apk` to phone (USB, Bluetooth, etc.)
2. Open file manager
3. Tap the APK file
4. Install

### Troubleshooting

#### QR Code Not Working

**Problem:** Scanning QR code gives connection error

**Solutions:**
1. Check if HTTP server is running: `python3 serve_apk.py`
2. Verify computer IP hasn't changed: `hostname -I` or `ipconfig`
3. Test URL on computer browser first
4. Ensure phone and computer are on same network
5. Check firewall settings (allow port 8080)

#### Can't Access Server

**Problem:** "Connection refused" or "Site can't be reached"

**Solutions:**
1. Start the server: `python3 serve_apk.py`
2. Check port 8080 is free: `netstat -ano | findstr :8080`
3. Try different port: Edit `serve_apk.py`, change `PORT = 8080` to `PORT = 8081`
4. Disable firewall temporarily for testing

#### APK Won't Install

**Problem:** "Install blocked" or "Unknown sources"

**Solutions:**
1. Enable "Unknown Sources" in Settings → Security
2. For Android 8+: Enable for specific app (browser) in "Install unknown apps"
3. Check if APK is corrupted (re-download)
4. Uninstall previous version first

#### Build Failures

**Problem:** Gradle build fails

**Solutions:**
1. Clean build: `./gradlew clean assembleDebug`
2. Check Android SDK is configured
3. Verify Java version (requires Java 11+)
4. Check disk space

### Integration with CI/CD

Add QR code generation to your CI/CD pipeline:

#### GitHub Actions Example

```yaml
name: Build and Generate QR Code

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
    
    - name: Build APK
      run: ./gradlew assembleDebug
    
    - name: Install QR Code Generator
      run: pip install qrcode[pil]
    
    - name: Generate QR Code
      run: |
        cd RayShopee
        python3 ../generate_qr.py
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: RayShopeeAndroid/app/build/outputs/apk/debug/app-debug.apk
    
    - name: Upload QR Code
      uses: actions/upload-artifact@v3
      with:
        name: qrcode
        path: qrcode_rede.png
```

#### GitLab CI Example

```yaml
stages:
  - build
  - deploy

build_apk:
  stage: build
  image: openjdk:11
  
  before_script:
    - apt-get update && apt-get install -y python3 python3-pip
    - pip3 install qrcode[pil]
    - chmod +x gradlew
  
  script:
    - ./gradlew assembleDebug
    - python3 generate_qr.py
  
  artifacts:
    paths:
      - RayShopeeAndroid/app/build/outputs/apk/debug/app-debug.apk
      - qrcode_rede.png
    expire_in: 1 week
```

### Customization

#### Change QR Code Colors

Edit `generate_qr.py`:

```python
img = qr.make_image(
    fill_color='#FF0000',  # Red
    back_color='#FFFFFF'   # White
)
```

#### Change QR Code Size

```python
qr = qrcode.QRCode(
    box_size=15,  # Larger pixels
    border=6,     # Larger border
)
```

#### Use Different Port

Edit `serve_apk.py`:

```python
PORT = 8081  # Change to desired port
```

Then regenerate QR code.

#### Custom URL

```python
# In generate_qr.py
url = "http://your-server.com/path/to/app-debug.apk"
```

### Security Considerations

⚠️ **Important Security Notes:**

1. **Local Network Only:**
   - Only use on trusted networks
   - Don't expose port 8080 to the internet
   - Use firewall to restrict access

2. **Debug APK:**
   - Debug builds contain sensitive information
   - Don't distribute outside your team
   - Use release builds for production

3. **HTTPS:**
   - For production, use HTTPS
   - Consider using ngrok for secure tunneling

4. **Authentication:**
   - Add authentication for production use
   - Consider using signed URLs

### Best Practices

#### ✅ Do

1. **Verify APK integrity:** Check SHA256 hash after download
2. **Use versioning:** Include version in filename (e.g., `app-v1.0.0-debug.apk`)
3. **Document changes:** Keep changelog for each build
4. **Test installation:** Always test on multiple devices
5. **Clean up:** Remove old APKs regularly

#### ❌ Don't

1. **Don't commit APKs to git:** Use artifacts or releases
2. **Don't share debug builds publicly:** Keep within team
3. **Don't ignore security warnings:** Read all installation prompts
4. **Don't skip testing:** Always test before distributing

### Automation Examples

#### Watch for Changes and Auto-Build

```bash
#!/bin/bash
# watch_and_build.sh

while true; do
    inotifywait -r -e modify,create,delete \
        RayShopeeAndroid/app/src/ \
        RayShopeeAndroid/build.gradle.kts
    
    echo "Changes detected, rebuilding..."
    ./gradlew assembleDebug
    python3 generate_qr.py
    echo "Build complete! QR code updated."
done
```

#### Slack Notification

```bash
#!/bin/bash
# notify_slack.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
APK_PATH="RayShopeeAndroid/app/build/outputs/apk/debug/app-debug.apk"
QR_PATH="qrcode_rede.png"

# Upload to Slack
curl -F file=@"$QR_PATH" \
     -F "initial_comment=New APK build ready!" \
     -F channels=#android-dev \
     -H "Authorization: Bearer $SLACK_TOKEN" \
     https://slack.com/api/files.upload
```

### Performance Tips

1. **Use incremental builds:**
   ```bash
   ./gradlew assembleDebug --offline
   ```

2. **Enable Gradle daemon:**
   ```bash
   echo "org.gradle.daemon=true" >> gradle.properties
   ```

3. **Increase heap size:**
   ```bash
   echo "org.gradle.jvmargs=-Xmx4g" >> gradle.properties
   ```

4. **Parallel execution:**
   ```bash
   echo "org.gradle.parallel=true" >> gradle.properties
   ```

### Related Tools

- **ngrok:** Secure tunneling for external access
- **adb:** Install APK via USB: `adb install app-debug.apk`
- **scrcpy:** Display and control Android device on PC
- **Charles Proxy:** Debug network requests
- **Firebase App Distribution:** Distribute to testers

### Migration Guide

#### From Manual Process

**Before:**
1. Build APK
2. Find APK in file explorer
3. Copy to phone
4. Install

**After:**
1. Build APK
2. Scan QR code
3. Install

#### From Other QR Tools

**Before:**
- Using third-party QR generator
- Manual URL entry
- Multiple steps

**After:**
- Integrated workflow
- Automatic URL detection
- One command

### Future Enhancements

- [ ] Auto-increment version code
- [ ] Upload to Firebase App Distribution
- [ ] Send push notifications
- [ ] Generate changelog automatically
- [ ] Compare APK sizes
- [ ] Security scanning
- [ ] Performance testing
- [ ] Screenshot generation

### Support

For issues or questions:

1. Check this guide
2. Review script files: `generate_qr.py`, `serve_apk.py`
3. Check Gradle build logs
4. Verify Python and dependencies are installed

### License

Same as RayShopeeAndroid project (Apache 2.0)

---

**💡 Pro Tip:** Add `qrcode_rede.png` to your `.gitignore` to avoid committing generated files!

**Last Updated:** 2026-05-05

## Migration from Old System

If migrating from the old `.memory/` markdown files:

1. Key information is already in `CONTEXT.md`
2. Use the CLI to import important items:

```bash
python memory_service.py --add "[Architecture] MVVM pattern" --category architecture
python memory_service.py --add "[API] Supabase REST endpoints" --category api_documentation
```

## Future Enhancements

- [ ] Auto-summarization of long documents
- [ ] Memory graph visualization
- [ ] Cross-project memory sharing
- [ ] Memory versioning
- [ ] Automated memory extraction from code

## Support

For issues or questions:
1. Check this guide
2. Review `memory_service.py` for implementation details
3. Check OpenMemory docs: https://openmemory.cavira.app/docs/sdks/python

## License

Same as RayShopeeAndroid project (Apache 2.0)
