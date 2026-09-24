#!/usr/bin/env bash
# scan-skill-cli.sh - CLI wrapper for SkillSpector skill scanning
# Provides an interactive interface to scan AI agent skills for security vulnerabilities

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults
SKILL_PATH=""
FORMAT="terminal"
OUTPUT_FILE=""
USE_LLM=false
VERBOSE=false
SHOW_HELP=false

print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  SkillSpector CLI - Scan Agent Skills${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_usage() {
  cat <<EOF
Usage: scan-skill-cli [OPTIONS] [SKILL_PATH]

Scan a skill for security vulnerabilities using SkillSpector.

ARGUMENTS:
  SKILL_PATH              Path to skill (directory, SKILL.md, URL, or zip file)

OPTIONS:
  -f, --format FORMAT     Output format: terminal, json, markdown, sarif
                          (default: terminal)
  -o, --output FILE       Save report to file
  -l, --llm              Enable LLM semantic analysis (requires API key)
  -v, --verbose          Show detailed progress
  -h, --help             Show this help message

EXAMPLES:
  # Scan local skill (static analysis only)
  scan-skill-cli ./my-skill/

  # Scan and save as JSON
  scan-skill-cli -f json -o report.json ./my-skill/

  # Scan with LLM analysis
  ANTHROPIC_API_KEY=sk-ant-... scan-skill-cli -l ./my-skill/

  # Scan GitHub repo
  scan-skill-cli https://github.com/user/skill-repo

EOF
}

print_menu() {
  echo ""
  echo -e "${BLUE}Options:${NC}"
  echo "  1) Scan skill (static analysis)"
  echo "  2) Scan skill (with LLM analysis)"
  echo "  3) Change output format"
  echo "  4) Set output file"
  echo "  5) View recent reports"
  echo "  6) Exit"
  echo ""
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -f|--format)
        FORMAT="$2"
        shift 2
        ;;
      -o|--output)
        OUTPUT_FILE="$2"
        shift 2
        ;;
      -l|--llm)
        USE_LLM=true
        shift
        ;;
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      -h|--help)
        SHOW_HELP=true
        shift
        ;;
      -*)
        echo -e "${RED}Error: Unknown option $1${NC}" >&2
        exit 1
        ;;
      *)
        SKILL_PATH="$1"
        shift
        ;;
    esac
  done
}

validate_skillspector() {
  if ! command -v skillspector &> /dev/null; then
    echo -e "${RED}✗ SkillSpector not found${NC}"
    echo ""
    echo "Install with:"
    echo "  uv tool install git+https://github.com/NVIDIA/skillspector.git"
    exit 1
  fi
}

validate_skill_path() {
  if [[ -z "$SKILL_PATH" ]]; then
    echo -e "${RED}Error: SKILL_PATH required${NC}" >&2
    exit 1
  fi

  # Check if path exists (for local files)
  if [[ "$SKILL_PATH" != http* ]]; then
    if [[ ! -e "$SKILL_PATH" ]]; then
      echo -e "${RED}Error: Path not found: $SKILL_PATH${NC}" >&2
      exit 1
    fi
  fi
}

run_scan() {
  validate_skill_path

  echo ""
  echo -e "${YELLOW}Scanning skill...${NC}"
  echo "  Path: $SKILL_PATH"
  echo "  Format: $FORMAT"
  echo "  LLM: $([ "$USE_LLM" = true ] && echo 'enabled' || echo 'disabled')"

  if [[ -n "$OUTPUT_FILE" ]]; then
    echo "  Output: $OUTPUT_FILE"
  fi
  echo ""

  # Build skillspector command
  local cmd=("skillspector" "scan" "$SKILL_PATH")
  cmd+=("--format" "$FORMAT")

  if [[ -n "$OUTPUT_FILE" ]]; then
    cmd+=("--output" "$OUTPUT_FILE")
  fi

  if [[ "$USE_LLM" = false ]]; then
    cmd+=("--no-llm")
  fi

  if [[ "$VERBOSE" = true ]]; then
    cmd+=("--verbose")
  fi

  # Run scan
  if "${cmd[@]}"; then
    echo ""
    echo -e "${GREEN}✓ Scan completed successfully${NC}"

    if [[ -n "$OUTPUT_FILE" ]]; then
      echo -e "${GREEN}✓ Report saved to: $OUTPUT_FILE${NC}"
    fi
    return 0
  else
    local exit_code=$?
    echo ""
    if [[ $exit_code -eq 1 ]]; then
      echo -e "${YELLOW}⚠ Risk detected (risk_score > 50)${NC}"
      return 1
    else
      echo -e "${RED}✗ Scan failed${NC}"
      return $exit_code
    fi
  fi
}

select_format() {
  echo ""
  echo -e "${BLUE}Output formats:${NC}"
  echo "  1) terminal   - Pretty formatted output (default)"
  echo "  2) json       - Machine-readable JSON"
  echo "  3) markdown   - Markdown report"
  echo "  4) sarif      - SARIF 2.1.0 (CI/CD integration)"
  echo ""
  read -p "Select format (1-4): " choice

  case $choice in
    1) FORMAT="terminal" ;;
    2) FORMAT="json" ;;
    3) FORMAT="markdown" ;;
    4) FORMAT="sarif" ;;
    *) echo -e "${RED}Invalid choice${NC}" ;;
  esac
}

set_output_file() {
  echo ""
  read -p "Enter output file path (leave empty for stdout): " file
  if [[ -n "$file" ]]; then
    OUTPUT_FILE="$file"
    echo -e "${GREEN}✓ Output file set to: $OUTPUT_FILE${NC}"
  else
    OUTPUT_FILE=""
    echo -e "${GREEN}✓ Output to stdout${NC}"
  fi
}

view_reports() {
  local reports_dir="skillspector-reports"

  if [[ ! -d "$reports_dir" ]]; then
    echo -e "${YELLOW}No reports directory found${NC}"
    return
  fi

  echo ""
  echo -e "${BLUE}Recent reports:${NC}"
  ls -lht "$reports_dir"/ 2>/dev/null | tail -10 || echo "  No reports yet"
}

interactive_mode() {
  print_header

  if [[ -z "$SKILL_PATH" ]]; then
    echo ""
    read -p "Enter skill path: " SKILL_PATH
  fi

  while true; do
    print_menu
    read -p "Select option (1-6): " choice

    case $choice in
      1)
        USE_LLM=false
        run_scan || true
        ;;
      2)
        USE_LLM=true
        run_scan || true
        ;;
      3)
        select_format
        ;;
      4)
        set_output_file
        ;;
      5)
        view_reports
        ;;
      6)
        echo -e "${GREEN}Goodbye!${NC}"
        exit 0
        ;;
      *)
        echo -e "${RED}Invalid option${NC}"
        ;;
    esac
  done
}

main() {
  parse_args "$@"

  if [[ "$SHOW_HELP" = true ]]; then
    print_usage
    exit 0
  fi

  validate_skillspector

  # Interactive mode if no skill path provided
  if [[ -z "$SKILL_PATH" ]]; then
    interactive_mode
  else
    # Non-interactive mode
    run_scan
  fi
}

main "$@"
