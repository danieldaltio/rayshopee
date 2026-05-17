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
    
    # Add Feature decision for Product Cost and Profit Calculator
    cost_content = (
        "Feature: Product Cost Tracking & Shopee Profit/Margin Calculator\n\n"
        "Description: Integrated a feature that allows sellers to optionally define product cost "
        "and automatically shows the estimated Shopee profit and profit margin in real-time.\n\n"
        "Key Changes:\n"
        "- Model updates: Added 'costCents: Long? = null' to Variation and Product models in com.shopeelister.domain.model.Product.kt.\n"
        "- ViewModel logic: Added 'updateCost(v: String)' in EditorViewModel.kt to parse and update product cost in cents.\n"
        "- Business logic: Created 'FinancialUtil.kt' utility in com.shopeelister.util to replicate RayShopee's Brazil Shopee fee tiers, "
        "including: 2% transaction fee, 6% gov tax, and the commission scale (varying from 8% to 25% plus a fixed fee of R$ 4,00 to R$ 46,00 and PIX subsidies).\n"
        "- UI components: Added responsive OutlinedTextFields for 'Custo Opcional' and beautiful Material 3 Cards for profit/margin visual feedback in EditorScreen.kt "
        "for both simple products and variation-based listings."
    )
    
    res = await mem.add(
        content=cost_content,
        tags=["financial", "cost", "profit-calculator", "shopee-fees", "kotlin", "compose"],
        category="code_patterns"
    )
    print(f"Added Cost & Profit Calculator memory entry: {res}")
    
    print("\nSession memory saved successfully!")

if __name__ == "__main__":
    asyncio.run(main())
