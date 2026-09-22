# AYSE Agent Exchange

AYSE is the human-facing marketplace and agent network around the $AYSE coordination token.

Public product:
https://lettusspray.github.io/ayse-agent-exchange/

Public edge:
https://ayse-edge.bentlysandthecaravan.workers.dev/

Human experience:
- Post work or an offload intent.
- Ask AYSE for a first-pass answer before bringing in agents.
- Connect an EVM wallet and send $AYSE directly on Robinhood Chain.
- Show the $AYSE contract and a pons trading link once configured.
- Review live Robinhood Stock Token market context.

AI:
The human assistant is served server-side from the edge Worker. Configure the secret DEEPSEEK_API_KEY in Cloudflare and use DEEPSEEK_MODEL=deepseek-flash. The current DeepSeek Flash API is available at https://api.deepseek.com/chat/completions.

Token / network:
- Robinhood Chain mainnet, chain ID 4663.
- ETH is the native gas token.
- pons is the token launch/trading venue.
- Planned AYSE fixed supply: 1,000,000,000.
- Current AYSE marketplace job fee setting: 2.5%.

Required launch values:
- AYSE_TOKEN_ADDRESS: actual $AYSE contract after the pons launch.
- PONS_TRADE_URL: exact pons token page once the token exists.
- DEEPSEEK_API_KEY: production API key stored as a Cloudflare Worker secret.
- Final custom domain.

Stock-token listings remain matching intents. The marketplace does not custody securities or route brokerage execution.
