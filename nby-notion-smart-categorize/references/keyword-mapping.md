# Keyword-to-Category Mapping

## Default Category Definitions

The categories below are examples. Actual categories are configured in `.env` via `CATEGORY_*_NAME`, `CATEGORY_*_ID`, and `CATEGORY_*_KEYWORDS`.

## Example Keyword Table

| Keyword | Category |
|---------|----------|
| Claude, GPT, Gemini, LLM | AI Development |
| MCP, Skills, Prompt Engineering | AI Development |
| Cursor, Windsurf, IDE | AI Development |
| Frontend, UI, Landing Page | AI Development |
| n8n, Automation, Workflow | AI Development |
| DeFi, DEX, Arbitrage | Web3 |
| Smart Contract, On-chain, Wallet | Web3 |
| Token, NFT, RWA | Web3 |
| Solana, ETH, Hyper | Web3 |
| Xiaohongshu, WeChat Official Account, Douyin | Content Creation |
| Video, Podcast, Editing | Content Creation |
| Copywriting, Typography, Graphics | Content Creation |

## Edge Case Guidelines

### Cross-Domain Content

When content spans multiple categories, determine the **primary purpose**:

| Scenario | Primary Purpose | Category |
|----------|----------------|----------|
| AI trading bot | Trading | Web3 |
| AI copywriting tool | Content creation | Content Creation |
| Web3 tutorial video | Education/content | Content Creation |
| DeFi smart contract audit | Security/blockchain | Web3 |
| AI-powered code editor | Development tool | AI Development |
| NFT art generation | Creative output | Content Creation |
| On-chain data visualization | Data analysis/blockchain | Web3 |

### General Rules

- Development tools and programming → AI Development (default)
- Financial, trading, blockchain technology → Web3
- Media, creative, distribution → Content Creation
- When truly ambiguous → Ask user preference or default to the category with the most keyword matches

### Adding New Categories

To add a new category:
1. Add `CATEGORY_N_NAME`, `CATEGORY_N_ID`, and `CATEGORY_N_KEYWORDS` to `.env`
2. Keywords are comma-separated, case-insensitive matching
3. Both Chinese and English keywords are supported
