# The cabinet server

The second PillScout server was a rebuild of the first, designed around what the first one taught: the model drifts where the data shape lets it, so the shape has to carry the constraint. What was built is a hardened shell: an Express server with hashed API keys, a complete OAuth token layer, redacted structured logging, rate limits, a migration runner, and one hello-world MCP tool with a contract test that refuses false greens. Nine cabinet tools (create, add, update, remove, get, summary, totals, preview, list) were fully specified, with their database tables and row-level security written and committed, and no handler code was ever written. It was never deployed. The corpus it was meant to serve is in ../record/.

Two excerpts here. design.md is the opening of the design document: what a cabinet is, who it is for, and the line between what the engine does and what it leaves to the model. test-09.md is one test file and the reason it exists.
