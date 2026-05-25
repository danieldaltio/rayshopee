import asyncio
import os
import sys
from pathlib import Path

# Add the scripts/util folder to python path so we can import memory_wrapper
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT / "scripts" / "util"))

from memory_wrapper import RayShopeeMemory

async def main():
    print("Connecting to OpenMemory database...")
    mem = RayShopeeMemory()
    
    if not mem.is_available:
        print("Error: OpenMemory is not available.")
        return
        
    print("Database available! Adding entries...")
    
    # 1. Add Renaming and Launcher Icon memory
    icon_content = (
        "Feature/Maintenance: App Renaming and 3D Launcher Icons\n\n"
        "Description: Renamed the order manager app to 'PedidosEditProduto' and replaced "
        "placeholder XML launcher icons with high-quality 3D rendered PNG assets for all 3 apps.\n\n"
        "Details:\n"
        "- Renamed 'apps/RayShopeeOrders' directory to 'apps/PedidosEditProduto'.\n"
        "- Updated 'settings.gradle.kts', 'strings.xml', TopAppBar title, and HTTP User-Agent to use 'PedidosEditProduto'.\n"
        "- Generated 3 separate 3D squircle icons matching each app's specific function (orange shopping bag with AI spark for ScanAddProdutos, green barcode with edit gear for ScanEditProduto, blue cargo box with profit growth arrow for PedidosEditProduto).\n"
        "- Removed old XML adaptive icon overrides from ScanAddProdutos and added proper android:icon/roundIcon properties in AndroidManifest.xml for all apps.\n"
        "- Clean compiled and installed all three apps successfully on the connected physical device (SM-M356B - Android 16)."
    )
    
    icon_res = await mem.add(
        content=icon_content,
        tags=["renaming", "android", "icons", "ux", "compilation", "design"],
        category="releases"
    )
    print(f"Added Renaming & Icon memory entry: {icon_res}")
    
    # 2. Add Raycast Search Fix memory
    search_content = (
        "Bug Fix/Optimization: Raycast Quick Search and Supabase-first Search Routing\n\n"
        "Description: Fixed a bug where Raycast quick search failed with 'error_not_found' "
        "due to rigid keyword matching in the official Shopee search API, and mapped missing "
        "cost/profit attributes.\n\n"
        "Details:\n"
        "- Refactored the '/api/products/search' endpoint in server/index.js.\n"
        "- First queries the local Supabase PostgreSQL cache using case-insensitive 'ILIKE' wildcard matching on name, variation_name, and SKU. This handles partial searches immediately.\n"
        "- Resolves associated Shopee item details (including images) in a fast batched call for the matched IDs.\n"
        "- Calculates and maps Shopee fee tiers, nett profit, and margins dynamically on the server before responding.\n"
        "- Implemented a fallback to the official Shopee '/api/v2/product/search_product' endpoint (with signature and access token validation) if the local query returns empty, merging any stored database costs."
    )
    
    search_res = await mem.add(
        content=search_content,
        tags=["raycast", "search", "supabase", "performance", "api", "bugfix"],
        category="code_patterns"
    )
    print(f"Added Raycast Search memory entry: {search_res}")
    
    print("\nRecent memories saved successfully to OpenMemory DB!")

if __name__ == "__main__":
    asyncio.run(main())
