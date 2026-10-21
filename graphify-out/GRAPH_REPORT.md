# Graph Report - Tracer  (2026-10-21)

## Corpus Check
- 12 files · ~2,822 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 77 nodes · 87 edges · 10 communities (7 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21ba4195`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server.js
- scan-skill-cli.sh
- package.json
- test-api.js
- scan_api.py
- Tracer
- Markdown Formatter
- vercel.json
- scan-skills.sh
- skills/README.md

## God Nodes (most connected - your core abstractions)
1. `interactive_mode()` - 8 edges
2. `main()` - 7 edges
3. `scripts` - 5 edges
4. `run_scan()` - 4 edges
5. `scan_skill()` - 4 edges
6. `Tracer` - 4 edges
7. `Markdown Formatter` - 4 edges
8. `scan-skill-cli.sh script` - 2 edges
9. `print_header()` - 2 edges
10. `print_usage()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 3 thin omitted)

### Community 0 - "server.js"
Cohesion: 0.16
Nodes (8): fs, path, fs, http, INDEX, path, result, scan

### Community 1 - "scan-skill-cli.sh"
Cohesion: 0.29
Nodes (13): interactive_mode(), main(), parse_args(), print_header(), print_menu(), print_usage(), run_scan(), select_format() (+5 more)

### Community 2 - "package.json"
Cohesion: 0.17
Nodes (11): author, description, keywords, license, name, scripts, build, dev (+3 more)

### Community 3 - "test-api.js"
Cohesion: 0.20
Nodes (7): ALLOWED_FORMATS, { spawn }, assert, call(), post(), result, scan

### Community 5 - "Tracer"
Cohesion: 0.40
Nodes (4): En local, Fonctionnement, Site web + API, Tracer

### Community 6 - "Markdown Formatter"
Cohesion: 0.40
Nodes (4): Features, Markdown Formatter, Output, Usage

### Community 7 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, routes

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._