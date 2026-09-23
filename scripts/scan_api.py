#!/usr/bin/env python3
"""Scan API - wrapper pour SkillSpector"""
import json
import subprocess
import sys
from pathlib import Path

def scan_skill(skill_path, format='json', use_llm=False):
    """Scanne un skill avec SkillSpector"""
    cmd = ['skillspector', 'scan', skill_path, '--format', format]
    if not use_llm:
        cmd.append('--no-llm')
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if format == 'json':
            return json.loads(result.stdout)
        return result.stdout
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: scan_api.py <skill_path> [format] [--llm]')
        sys.exit(1)
    
    skill_path = sys.argv[1]
    format_type = sys.argv[2] if len(sys.argv) > 2 else 'json'
    use_llm = '--llm' in sys.argv
    
    report = scan_skill(skill_path, format_type, use_llm)
    if isinstance(report, dict):
        print(json.dumps(report, indent=2))
    else:
        print(report)
