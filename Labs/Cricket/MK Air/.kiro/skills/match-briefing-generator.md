---
inclusion: manual
---

# Match Briefing Generator

A reusable Python script (`scripts/generate_match_briefing.py`) that auto-generates pre-match intelligence reports for any MK Air CC opponent across all teams (FCCL, NCL Team2, NCL Team3, Team1).

## What It Does

1. **Reads opponent batting/bowling Excel files** — any play-cricket download format with columns like Player, Games, Inns, Runs, Avg, SR, Wickets, Overs, Economy, etc.
2. **Classifies batters** into three tiers:
   - **Danger** — avg 35+ or 400+ runs or has centuries
   - **Solid** — avg 20+ or 200+ runs
   - **Weak** — the rest (target these)
3. **Classifies bowlers** into three tiers:
   - **Strike** — 20+ wickets or avg ≤ 15
   - **Support** — 10+ wickets or economy ≤ 5
   - **Part-timers** — the rest (score off these)
4. **Reads your team CSV** (play-cricket download) and pulls last match performance (top batters, top bowlers, result)
5. **Generates bowling matchups** — assigns your bowlers to their danger batters
6. **Generates batting plans** — how to score vs each bowler type (respect strike bowlers, rotate vs support, attack part-timers)
7. **Outputs a styled HTML report** with colour-coded player cards, full stats tables, and a tactical game plan
8. **Converts to PDF** via Chrome headless (or use `--no-pdf` for HTML only)

## Dependencies

```bash
pip install pandas openpyxl
```

Google Chrome must be installed for PDF conversion.

## Usage

Run from the workspace root (`C:\Users\srika\Labs\Cricket\MK Air`):

```bash
python scripts/generate_match_briefing.py \
  --opponent-batting "FCCL Team/Opposition/Stoke Hammond CC/Stoke Hammond 2025 batting statistics.xlsx" \
  --opponent-bowling "FCCL Team/Opposition/Stoke Hammond CC/Stoke Hammond 2025 bowling statistics.xlsx" \
  --team-csv "Team1/2025/team 2 stats.csv" \
  --opponent-name "Stoke Hammond CC" \
  --match-date "Saturday 25 April 2026" \
  --match-time "13:30" \
  --venue "The Recreation Ground" \
  --home-or-away "Away" \
  --squad "Srikanth Chundi:Bat,Shashi Kiran:WK Bat,Sunit Sar:Bowler" \
  --output "FCCL Team/Opposition/Stoke Hammond CC/"
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--opponent-batting` | Yes | Path to opponent batting stats Excel |
| `--opponent-bowling` | Yes | Path to opponent bowling stats Excel |
| `--team-csv` | No | Path to our team stats CSV (for last match analysis) |
| `--opponent-name` | Yes | Opponent team name |
| `--match-date` | No | Match date (default: TBD) |
| `--match-time` | No | Match time (default: TBD) |
| `--venue` | No | Venue name (default: TBD) |
| `--home-or-away` | No | Home or Away (default: TBD) |
| `--squad` | Yes | Squad as `Name1:Role1,Name2:Role2,...` |
| `--output` | No | Output folder (default: current directory) |
| `--no-pdf` | No | Skip PDF generation, HTML only |

## Squad Roles

Use these role labels in the `--squad` argument:
- `Bat` — specialist batter
- `WK Bat` — wicketkeeper batter
- `Batting All-rounder` — bats and bowls (bat-primary)
- `Bowl All-rounder` — bowls and bats (bowl-primary)
- `Bowler` — specialist bowler
- `Spinner` — specialist spin bowler

## Output

The script generates two files in the `--output` folder:
- `MK_Air_vs_{OpponentName}_Briefing.html` — styled report
- `MK_Air_vs_{OpponentName}_Briefing.pdf` — print-ready PDF

## Data Sources

- Opponent stats: download from play-cricket.com Statistics page (batting + bowling tabs, export to Excel)
- Team stats: download from play-cricket.com via the club admin download_statistics feature (CSV format)

## File Location

#[[file:scripts/generate_match_briefing.py]]
