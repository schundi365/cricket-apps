#!/usr/bin/env python3
"""
MK Air CC — Match Briefing Generator
=====================================
Auto-generates a pre-match intelligence report (HTML + PDF) for any opponent,
for any team (FCCL, NCL Team2, NCL Team3, Team1, etc.).

Run from the workspace root: C:\\Users\\srika\\Labs\\Cricket\\MK Air

Usage:
    python scripts/generate_match_briefing.py \\
        --opponent-batting "path/to/opponent_batting.xlsx" \\
        --opponent-bowling "path/to/opponent_bowling.xlsx" \\
        --team-csv "path/to/our_team_stats.csv" \\
        --opponent-name "Opponent Name" \\
        --match-date "Saturday 25 April 2026" \\
        --match-time "13:30" \\
        --venue "Ground Name" \\
        --home-or-away "Away" \\
        --squad "Player1:Role1,Player2:Role2,..." \\
        --output "output_folder/"

Dependencies: pip install pandas openpyxl
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "--quiet"])
    import pandas as pd


# ─── DATA LOADING ───────────────────────────────────────────────────────────────

def load_opponent_batting(path):
    """Load opponent batting stats from Excel."""
    df = pd.read_excel(path)
    # Normalise column names
    col_map = {}
    for c in df.columns:
        cl = str(c).strip().lower()
        if cl in ("player", "player name", "name"):
            col_map[c] = "Player"
        elif cl in ("games", "matches", "mat"):
            col_map[c] = "Games"
        elif cl in ("inns", "innings"):
            col_map[c] = "Inns"
        elif cl in ("not outs", "no", "not out"):
            col_map[c] = "NO"
        elif cl in ("runs",):
            col_map[c] = "Runs"
        elif cl in ("high score", "hs", "highest score"):
            col_map[c] = "HS"
        elif cl in ("avg", "average", "bat avg"):
            col_map[c] = "Avg"
        elif cl in ("50s", "fifties"):
            col_map[c] = "50s"
        elif cl in ("100s", "hundreds", "centuries"):
            col_map[c] = "100s"
        elif cl in ("strike rate", "sr"):
            col_map[c] = "SR"
        elif cl in ("high score not out",):
            col_map[c] = "HS_NO"
    df = df.rename(columns=col_map)
    # Ensure numeric
    for col in ["Games", "Inns", "NO", "Runs", "Avg", "50s", "100s", "SR"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def load_opponent_bowling(path):
    """Load opponent bowling stats from Excel."""
    df = pd.read_excel(path)
    col_map = {}
    for c in df.columns:
        cl = str(c).strip().lower()
        if cl in ("player", "player name", "name"):
            col_map[c] = "Player"
        elif cl in ("overs",):
            col_map[c] = "Overs"
        elif cl in ("maidens", "mdns"):
            col_map[c] = "Maidens"
        elif cl in ("runs",):
            col_map[c] = "Runs"
        elif cl in ("wickets", "wkts"):
            col_map[c] = "Wickets"
        elif cl in ("best bowling", "best", "bb"):
            col_map[c] = "Best"
        elif cl in ("5 wicket haul", "5w", "5wi"):
            col_map[c] = "5W"
        elif cl in ("economy rate", "economy", "econ"):
            col_map[c] = "Econ"
        elif cl in ("strike rate", "sr"):
            col_map[c] = "BowlSR"
        elif cl in ("average", "avg", "bowl avg"):
            col_map[c] = "BowlAvg"
    df = df.rename(columns=col_map)
    for col in ["Overs", "Maidens", "Runs", "Wickets", "Econ", "BowlSR", "BowlAvg"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def load_team_csv(path):
    """Load our team stats CSV (play-cricket download format)."""
    df = pd.read_csv(path)
    return df


# ─── ANALYSIS ENGINE ────────────────────────────────────────────────────────────

def analyse_opponent_batting(bat_df):
    """Classify opponent batters into danger men, solid, and weak."""
    if bat_df.empty:
        return [], [], []

    bat_df = bat_df.sort_values("Runs", ascending=False).reset_index(drop=True)
    danger, solid, weak = [], [], []

    for _, row in bat_df.iterrows():
        p = {
            "name": str(row.get("Player", "Unknown")),
            "games": int(row.get("Games", 0)),
            "inns": int(row.get("Inns", 0)),
            "no": int(row.get("NO", 0)),
            "runs": int(row.get("Runs", 0)),
            "hs": str(row.get("HS", "-")),
            "avg": round(float(row.get("Avg", 0)), 2),
            "fifties": int(row.get("50s", 0)),
            "hundreds": int(row.get("100s", 0)),
            "sr": round(float(row.get("SR", 0)), 2),
        }
        if p["inns"] < 3:
            continue  # skip players with too few innings

        if p["runs"] >= 400 or p["avg"] >= 35 or p["hundreds"] >= 1:
            danger.append(p)
        elif p["avg"] >= 20 or p["runs"] >= 200:
            solid.append(p)
        else:
            weak.append(p)

    return danger, solid, weak


def analyse_opponent_bowling(bowl_df):
    """Classify opponent bowlers into strike, support, and part-timers."""
    if bowl_df.empty:
        return [], [], []

    bowl_df = bowl_df.sort_values("Wickets", ascending=False).reset_index(drop=True)
    strike, support, parttimers = [], [], []

    for _, row in bowl_df.iterrows():
        b = {
            "name": str(row.get("Player", "Unknown")),
            "overs": float(row.get("Overs", 0)),
            "maidens": int(row.get("Maidens", 0)),
            "runs": int(row.get("Runs", 0)),
            "wickets": int(row.get("Wickets", 0)),
            "best": str(row.get("Best", "-")),
            "fiveW": str(row.get("5W", "0")),
            "econ": round(float(row.get("Econ", 0)), 2),
            "sr": round(float(row.get("BowlSR", 0)), 2),
            "avg": round(float(row.get("BowlAvg", 0)), 2),
        }
        if b["wickets"] < 3:
            continue

        if b["wickets"] >= 20 or b["avg"] <= 15:
            strike.append(b)
        elif b["wickets"] >= 10 or b["econ"] <= 5:
            support.append(b)
        else:
            parttimers.append(b)

    return strike, support, parttimers


def analyse_our_team(team_df, squad_list):
    """Analyse our team's recent performance from the CSV."""
    results = {}
    if team_df.empty:
        return results

    # Get unique fixture dates sorted
    fixtures = team_df.drop_duplicates(subset=["fx_fixtureID"]).sort_values("FixtureDate")
    if not fixtures.empty:
        last = fixtures.iloc[-1]
        results["last_match"] = {
            "opponent": last.get("Opponent", "Unknown"),
            "date": last.get("FixtureDate", ""),
            "home_away": last.get("HomeAway", ""),
            "team_runs": int(last.get("TeamRuns", 0)),
            "won": int(last.get("TotalWon", 0)) > 0,
        }
        last_id = last["fx_fixtureID"]
        last_match_df = team_df[team_df["fx_fixtureID"] == last_id]
        results["last_match_batting"] = []
        results["last_match_bowling"] = []
        for _, r in last_match_df.iterrows():
            name = r.get("Player Name", "")
            runs = int(r.get("Runs", 0))
            how_out = r.get("HowOut", "")
            wkts = int(r.get("Wickets", 0))
            bowl_runs = int(r.get("BowlingRuns", 0))
            if how_out != "Did Not Bat":
                results["last_match_batting"].append({"name": name, "runs": runs, "how_out": how_out})
            if wkts > 0:
                results["last_match_bowling"].append({"name": name, "wickets": wkts, "runs": bowl_runs})

    # Season batting stats per player
    batting = team_df.groupby("Player Name").agg(
        matches=("fx_fixtureID", "nunique"),
        total_runs=("Runs", "sum"),
        highest=("Runs", "max"),
        total_balls=("Balls", "sum"),
    ).reset_index()
    batting["avg"] = (batting["total_runs"] / batting["matches"]).round(1)
    batting = batting.sort_values("total_runs", ascending=False)
    results["batting_stats"] = batting.to_dict("records")

    # Season bowling stats per player
    bowlers = team_df[team_df["Wickets"] > 0].groupby("Player Name").agg(
        total_wickets=("Wickets", "sum"),
        runs_conceded=("BowlingRuns", "sum"),
        balls_bowled=("BallsBowled", "sum"),
    ).reset_index()
    bowlers["econ"] = ((bowlers["runs_conceded"] / bowlers["balls_bowled"]) * 6).round(2)
    bowlers["bowl_avg"] = (bowlers["runs_conceded"] / bowlers["total_wickets"]).round(1)
    bowlers = bowlers.sort_values("total_wickets", ascending=False)
    results["bowling_stats"] = bowlers.to_dict("records")

    return results


# ─── TACTICAL PLAN GENERATOR ────────────────────────────────────────────────────

def generate_bowling_plan(danger_bat, strike_bowl, squad):
    """Generate who should bowl at whom."""
    plans = []
    # Find our bowlers from squad
    our_bowlers = [s for s in squad if any(r in s["role"].lower() for r in ["bowl", "spinner"])]
    our_bat_ar = [s for s in squad if "all-rounder" in s["role"].lower() and "bat" in s["role"].lower()]

    for i, d in enumerate(danger_bat[:4]):
        if i < len(our_bowlers):
            plans.append(f"{our_bowlers[i]['name']} to bowl at {d['name']} (avg {d['avg']}, SR {d['sr']})")
    return plans


def generate_batting_plan(strike_bowl, support_bowl, parttimer_bowl, squad):
    """Generate batting approach vs their bowlers."""
    plans = []
    for b in strike_bowl:
        plans.append(f"RESPECT {b['name']} ({b['wickets']} wkts, econ {b['econ']}). See him off, don't attack early.")
    for b in support_bowl:
        if b["econ"] <= 4:
            plans.append(f"Rotate strike vs {b['name']} (econ {b['econ']}). Don't let him strangle scoring.")
        else:
            plans.append(f"Can attack {b['name']} in middle overs (econ {b['econ']}).")
    for b in parttimer_bowl:
        if b["econ"] >= 7:
            plans.append(f"TARGET {b['name']} for runs (econ {b['econ']} — leaks runs).")
        else:
            plans.append(f"Part-timer {b['name']} — look for scoring opportunities.")
    return plans


# ─── HTML REPORT BUILDER ────────────────────────────────────────────────────────

def build_html(opponent_name, match_date, match_time, venue, home_away,
               danger_bat, solid_bat, weak_bat,
               strike_bowl, support_bowl, parttimer_bowl,
               squad, our_analysis, bowling_plans, batting_plans,
               bat_df, bowl_df):
    """Build the full HTML match briefing."""

    def player_card(p, card_class, badge_class, badge_text):
        hs_str = str(p["hs"])
        fifties = p.get("fifties", 0)
        hundreds = p.get("hundreds", 0)
        milestones = []
        if hundreds: milestones.append(f"{hundreds} hundred{'s' if hundreds > 1 else ''}")
        if fifties: milestones.append(f"{fifties} fifty/fifties")
        ms = ", ".join(milestones) if milestones else ""
        return f'''<div class="card {card_class}">
    <h3><span class="badge {badge_class}">{badge_text}</span> {p["name"]}</h3>
    <div class="stats">{p["games"]} games | {p["inns"]} inns | {p["runs"]} runs | HS {hs_str} | Avg {p["avg"]} | SR {p["sr"]}{" | " + ms if ms else ""}</div>
</div>'''

    def bowler_row(b, highlight=""):
        style = f' style="background:{highlight};"' if highlight else ""
        return f'<tr{style}><td>{b["name"]}</td><td>{b["wickets"]}</td><td>{b["econ"]}</td><td>{b["avg"]}</td><td>{b["best"]}</td><td>{b["overs"]}</td></tr>'

    # Build danger cards
    danger_cards = "\n".join(player_card(p, "danger", "badge-danger", "DANGER") for p in danger_bat)
    solid_cards = "\n".join(player_card(p, "warning", "badge-warning", "SOLID") for p in solid_bat[:6])
    weak_cards = "\n".join(player_card(p, "target", "badge-success", "TARGET") for p in weak_bat[:6])

    # Build bowling table
    bowl_rows = ""
    for b in strike_bowl:
        bowl_rows += bowler_row(b, "#fff5f5")
    for b in support_bowl:
        bowl_rows += bowler_row(b, "")
    for b in parttimer_bowl:
        bowl_rows += bowler_row(b, "#f0fff4")

    # Squad table
    squad_rows = ""
    for i, s in enumerate(squad, 1):
        squad_rows += f'<tr><td>{i}</td><td>{s["name"]}</td><td>{s["role"]}</td></tr>\n'

    # Bowling plans
    bowl_plan_html = "\n".join(f"<li>{p}</li>" for p in bowling_plans)
    bat_plan_html = "\n".join(f"<li>{p}</li>" for p in batting_plans)

    # Last match summary
    last_match_html = ""
    if "last_match" in our_analysis:
        lm = our_analysis["last_match"]
        result = "WON ✅" if lm["won"] else "LOST ❌"
        last_match_html = f'''<div class="highlight-box {'green' if lm['won'] else 'red'}">
    <strong>Last match:</strong> vs {lm["opponent"]} ({lm["home_away"]}) — {lm["date"]} — Team score: {lm["team_runs"]} — {result}
</div>'''
        if our_analysis.get("last_match_batting"):
            top_bat = sorted(our_analysis["last_match_batting"], key=lambda x: x["runs"], reverse=True)[:5]
            last_match_html += '<p style="font-size:13px;margin-top:6px;"><strong>Top batters:</strong> '
            last_match_html += ", ".join(f'{b["name"]} {b["runs"]}{"*" if b["how_out"] == "Not Out" else ""}' for b in top_bat)
            last_match_html += "</p>"
        if our_analysis.get("last_match_bowling"):
            top_bowl = sorted(our_analysis["last_match_bowling"], key=lambda x: x["wickets"], reverse=True)[:5]
            last_match_html += '<p style="font-size:13px;"><strong>Top bowlers:</strong> '
            last_match_html += ", ".join(f'{b["name"]} {b["wickets"]}/{b["runs"]}' for b in top_bowl)
            last_match_html += "</p>"

    # Full batting stats table
    full_bat_rows = ""
    if bat_df is not None and not bat_df.empty:
        for i, (_, row) in enumerate(bat_df.iterrows(), 1):
            bg = ' style="background:#fff5f5;"' if row.get("Runs", 0) >= 400 else ""
            full_bat_rows += f'''<tr{bg}><td>{i}</td><td>{row.get("Player","")}</td><td>{int(row.get("Games",0))}</td><td>{int(row.get("Inns",0))}</td><td>{int(row.get("NO",0))}</td><td>{int(row.get("Runs",0))}</td><td>{row.get("HS","")}</td><td>{row.get("Avg",0)}</td><td>{int(row.get("50s",0))}</td><td>{int(row.get("100s",0))}</td><td>{row.get("SR",0)}</td></tr>\n'''

    full_bowl_rows = ""
    if bowl_df is not None and not bowl_df.empty:
        for i, (_, row) in enumerate(bowl_df.iterrows(), 1):
            bg = ' style="background:#fff5f5;"' if row.get("Wickets", 0) >= 20 else ""
            full_bowl_rows += f'''<tr{bg}><td>{i}</td><td>{row.get("Player","")}</td><td>{row.get("Overs",0)}</td><td>{int(row.get("Maidens",0))}</td><td>{int(row.get("Runs",0))}</td><td>{int(row.get("Wickets",0))}</td><td>{row.get("Best","")}</td><td>{row.get("Econ",0)}</td><td>{row.get("BowlSR",0)}</td><td>{row.get("BowlAvg",0)}</td></tr>\n'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MK Air CC vs {opponent_name} — Match Briefing</title>
<style>
  @page {{ size: A4; margin: 15mm; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; line-height: 1.5; background: #fff; padding: 20px; max-width: 900px; margin: 0 auto; }}
  .header {{ background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 25px; }}
  .header h1 {{ font-size: 24px; margin-bottom: 5px; }}
  .header .subtitle {{ font-size: 15px; color: #a8d8ea; }}
  .header .match-info {{ font-size: 13px; color: #e2e2e2; margin-top: 10px; }}
  .section {{ margin-bottom: 22px; page-break-inside: avoid; }}
  .section-title {{ font-size: 17px; font-weight: 700; color: #0f3460; border-bottom: 3px solid #e94560; padding-bottom: 6px; margin-bottom: 12px; }}
  .card {{ background: #f8f9fa; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; border-left: 4px solid #0f3460; }}
  .card.danger {{ border-left-color: #e94560; background: #fff5f5; }}
  .card.target {{ border-left-color: #2ecc71; background: #f0fff4; }}
  .card.warning {{ border-left-color: #f39c12; background: #fffbf0; }}
  .card h3 {{ font-size: 14px; color: #0f3460; margin-bottom: 3px; }}
  .card .stats {{ font-size: 12px; color: #555; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; color: white; margin-right: 5px; }}
  .badge-danger {{ background: #e94560; }}
  .badge-success {{ background: #2ecc71; }}
  .badge-warning {{ background: #f39c12; }}
  table {{ width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }}
  th {{ background: #0f3460; color: white; padding: 7px 8px; text-align: left; }}
  td {{ padding: 6px 8px; border-bottom: 1px solid #e0e0e0; }}
  tr:nth-child(even) {{ background: #f4f6f8; }}
  .highlight-box {{ background: #eaf4fe; border: 1px solid #b3d7f5; border-radius: 8px; padding: 12px; margin: 10px 0; font-size: 13px; }}
  .highlight-box.red {{ background: #fef0f0; border-color: #f5b3b3; }}
  .highlight-box.green {{ background: #f0fef4; border-color: #b3f5c4; }}
  .game-plan {{ background: linear-gradient(135deg, #16213e, #0f3460); color: white; border-radius: 12px; padding: 20px; margin-top: 20px; }}
  .game-plan h2 {{ font-size: 18px; margin-bottom: 10px; color: #a8d8ea; }}
  .game-plan li {{ font-size: 12px; margin-bottom: 4px; }}
  .game-plan ul {{ padding-left: 18px; }}
  .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
  .footer {{ text-align: center; padding: 12px; color: #888; font-size: 10px; border-top: 1px solid #eee; margin-top: 20px; }}
  @media print {{ body {{ padding: 0; }} .section {{ page-break-inside: avoid; }} }}
</style>
</head>
<body>

<div class="header">
  <h1>🏏 MK Air CC vs {opponent_name}</h1>
  <div class="subtitle">FCCL Division 2 — Pre-Match Intelligence Briefing</div>
  <div class="match-info">📅 {match_date} &nbsp;|&nbsp; 🕐 {match_time} &nbsp;|&nbsp; 📍 {venue} ({home_away})</div>
</div>

<div class="section">
  <div class="section-title">🚨 Danger Men — MUST Contain ({len(danger_bat)} identified)</div>
  {danger_cards if danger_cards else '<p style="color:#888;">No high-threat batters identified (all avg &lt; 35, runs &lt; 400).</p>'}
</div>

<div class="section">
  <div class="section-title">⚠️ Solid Contributors ({len(solid_bat)} identified)</div>
  {solid_cards if solid_cards else '<p style="color:#888;">None identified.</p>'}
</div>

<div class="section">
  <div class="section-title">🎯 Weak Links — TARGET These ({len(weak_bat)} identified)</div>
  {weak_cards if weak_cards else '<p style="color:#888;">None identified.</p>'}
</div>

<div class="section">
  <div class="section-title">🎳 Their Bowling Attack</div>
  <table>
    <thead><tr><th>Bowler</th><th>Wkts</th><th>Econ</th><th>Avg</th><th>Best</th><th>Overs</th></tr></thead>
    <tbody>{bowl_rows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">🏏 Our Squad</div>
  <table>
    <thead><tr><th>#</th><th>Player</th><th>Role</th></tr></thead>
    <tbody>{squad_rows}</tbody>
  </table>
  {last_match_html}
</div>

<div class="game-plan">
  <h2>🎯 Bowling Matchups (Our Bowlers vs Their Batters)</h2>
  <ul>{bowl_plan_html}</ul>
  <h2 style="margin-top:14px;">🏏 Batting Plan (vs Their Bowlers)</h2>
  <ul>{bat_plan_html}</ul>
</div>

<div class="section" style="margin-top:25px;">
  <div class="section-title">📋 {opponent_name} — Full Batting Statistics</div>
  <table style="font-size:11px;">
    <thead><tr><th>#</th><th>Player</th><th>Games</th><th>Inns</th><th>NO</th><th>Runs</th><th>HS</th><th>Avg</th><th>50s</th><th>100s</th><th>SR</th></tr></thead>
    <tbody>{full_bat_rows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">📋 {opponent_name} — Full Bowling Statistics</div>
  <table style="font-size:11px;">
    <thead><tr><th>#</th><th>Player</th><th>Overs</th><th>Mdns</th><th>Runs</th><th>Wkts</th><th>Best</th><th>Econ</th><th>SR</th><th>Avg</th></tr></thead>
    <tbody>{full_bowl_rows}</tbody>
  </table>
</div>

<div class="footer">MK Air CC — FCCL Division 2 Match Intelligence Report | Confidential — For Team Use Only</div>

</body>
</html>'''
    return html


# ─── PDF CONVERSION ─────────────────────────────────────────────────────────────

def convert_to_pdf(html_path, pdf_path):
    """Convert HTML to PDF using Chrome headless."""
    chrome_paths = [
        os.path.join(os.environ.get("ProgramFiles", ""), "Google", "Chrome", "Application", "chrome.exe"),
        os.path.join(os.environ.get("ProgramFiles(x86)", ""), "Google", "Chrome", "Application", "chrome.exe"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google", "Chrome", "Application", "chrome.exe"),
        # macOS
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        # Linux
        "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium",
    ]
    chrome = None
    for p in chrome_paths:
        if p and os.path.exists(p):
            chrome = p
            break

    if chrome:
        file_url = "file:///" + html_path.replace("\\", "/")
        subprocess.run([chrome, "--headless", "--disable-gpu", f"--print-to-pdf={pdf_path}", file_url],
                       capture_output=True, timeout=30)
        if os.path.exists(pdf_path):
            print(f"✅ PDF created: {pdf_path}")
            return True
        else:
            print(f"⚠️  Chrome ran but PDF not created. Open the HTML in a browser and print to PDF.")
            return False
    else:
        print("⚠️  Chrome not found. To create PDF:")
        print(f"   1. Open {html_path} in your browser")
        print("   2. Press Ctrl+P → Save as PDF")
        return False


# ─── MAIN ────────────────────────────────────────────────────────────────────────

def parse_squad(squad_str):
    """Parse squad string like 'Name1:Role1,Name2:Role2,...'"""
    squad = []
    for entry in squad_str.split(","):
        entry = entry.strip()
        if ":" in entry:
            name, role = entry.split(":", 1)
            squad.append({"name": name.strip(), "role": role.strip()})
        else:
            squad.append({"name": entry.strip(), "role": "Player"})
    return squad


def main():
    parser = argparse.ArgumentParser(
        description="MK Air CC — Match Briefing Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:

  # FCCL Team
  python scripts/generate_match_briefing.py \\
    --opponent-batting "FCCL Team/Opposition/Stoke Hammond CC/Stoke Hammond 2025 batting statistics.xlsx" \\
    --opponent-bowling "FCCL Team/Opposition/Stoke Hammond CC/Stoke Hammond 2025 bowling statistics.xlsx" \\
    --team-csv "Team1/2025/team 2 stats.csv" \\
    --opponent-name "Stoke Hammond CC" \\
    --match-date "Saturday 25 April 2026" --match-time "13:30" \\
    --venue "The Recreation Ground" --home-or-away "Away" \\
    --squad "Srikanth Chundi:Bat,Shashi Kiran:WK Bat,Sunit Sar:Bowler" \\
    --output "FCCL Team/Opposition/Stoke Hammond CC/"

  # NCL Team2
  python scripts/generate_match_briefing.py \\
    --opponent-batting "NCL Team2/Opposition/SomeTeam/batting.xlsx" \\
    --opponent-bowling "NCL Team2/Opposition/SomeTeam/bowling.xlsx" \\
    --team-csv "Team1/2025/team1 stats.csv" \\
    --opponent-name "Some Team CC" \\
    --squad "Player1:Bat,Player2:Bowler" \\
    --output "NCL Team2/Opposition/SomeTeam/"
        """)

    parser.add_argument("--opponent-batting", required=True, help="Path to opponent batting stats Excel file")
    parser.add_argument("--opponent-bowling", required=True, help="Path to opponent bowling stats Excel file")
    parser.add_argument("--team-csv", required=False, default=None, help="Path to our team stats CSV (optional)")
    parser.add_argument("--opponent-name", required=True, help="Opponent team name")
    parser.add_argument("--match-date", default="TBD", help="Match date")
    parser.add_argument("--match-time", default="TBD", help="Match time")
    parser.add_argument("--venue", default="TBD", help="Venue name")
    parser.add_argument("--home-or-away", default="TBD", help="Home or Away")
    parser.add_argument("--squad", required=True, help="Squad as 'Name1:Role1,Name2:Role2,...'")
    parser.add_argument("--output", default=".", help="Output folder for HTML and PDF")
    parser.add_argument("--no-pdf", action="store_true", help="Skip PDF generation (HTML only)")

    args = parser.parse_args()

    print(f"🏏 Generating match briefing: MK Air CC vs {args.opponent_name}")
    print(f"   Batting stats: {args.opponent_batting}")
    print(f"   Bowling stats: {args.opponent_bowling}")

    # Load data
    bat_df = load_opponent_batting(args.opponent_batting)
    bowl_df = load_opponent_bowling(args.opponent_bowling)
    print(f"   Loaded {len(bat_df)} batters, {len(bowl_df)} bowlers")

    team_df = pd.DataFrame()
    if args.team_csv and os.path.exists(args.team_csv):
        team_df = load_team_csv(args.team_csv)
        print(f"   Loaded {len(team_df)} team stat rows")

    squad = parse_squad(args.squad)
    print(f"   Squad: {len(squad)} players")

    # Analyse
    danger_bat, solid_bat, weak_bat = analyse_opponent_batting(bat_df)
    strike_bowl, support_bowl, parttimer_bowl = analyse_opponent_bowling(bowl_df)
    our_analysis = analyse_our_team(team_df, squad) if not team_df.empty else {}

    print(f"\n📊 Analysis:")
    print(f"   Danger batters: {len(danger_bat)} | Solid: {len(solid_bat)} | Weak: {len(weak_bat)}")
    print(f"   Strike bowlers: {len(strike_bowl)} | Support: {len(support_bowl)} | Part-timers: {len(parttimer_bowl)}")

    # Generate plans
    bowling_plans = generate_bowling_plan(danger_bat, strike_bowl, squad)
    batting_plans = generate_batting_plan(strike_bowl, support_bowl, parttimer_bowl, squad)

    # Build HTML
    html = build_html(
        args.opponent_name, args.match_date, args.match_time, args.venue, args.home_or_away,
        danger_bat, solid_bat, weak_bat,
        strike_bowl, support_bowl, parttimer_bowl,
        squad, our_analysis, bowling_plans, batting_plans,
        bat_df, bowl_df
    )

    # Write output
    os.makedirs(args.output, exist_ok=True)
    safe_name = args.opponent_name.replace(" ", "_").replace("/", "_")
    html_path = os.path.join(args.output, f"MK_Air_vs_{safe_name}_Briefing.html")
    pdf_path = os.path.join(args.output, f"MK_Air_vs_{safe_name}_Briefing.pdf")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"\n✅ HTML report: {os.path.abspath(html_path)}")

    if not args.no_pdf:
        convert_to_pdf(os.path.abspath(html_path), os.path.abspath(pdf_path))

    print("\n🏏 Done! Good luck on match day!")


if __name__ == "__main__":
    main()
