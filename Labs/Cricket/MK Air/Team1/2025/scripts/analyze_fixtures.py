import pandas as pd
import numpy as np
from datetime import datetime

# Read the fixtures
fixtures_df = pd.read_excel('../FCCL_2026_fixtures.xlsx')
print("=== 2026 FIXTURES ===")
print(fixtures_df.to_string())
print("\n" + "="*80 + "\n")

# Read team stats
stats_df = pd.read_csv('../team 2 stats.csv')

# Analyze player performance
print("=== TEAM 2 PLAYER PERFORMANCE ANALYSIS ===\n")

# Batting analysis
batting_stats = stats_df.groupby('Player Name').agg({
    'Runs': ['sum', 'mean', 'max'],
    'Balls': 'sum',
    'Fours': 'sum',
    'Sixes': 'sum',
    'FixtureDate': 'count'
}).round(2)

batting_stats.columns = ['Total Runs', 'Avg Runs', 'Highest Score', 'Total Balls', 'Fours', 'Sixes', 'Matches']
batting_stats['Strike Rate'] = ((batting_stats['Total Runs'] / batting_stats['Total Balls']) * 100).round(2)
batting_stats = batting_stats.sort_values('Total Runs', ascending=False)

print("TOP BATSMEN:")
print(batting_stats.head(10).to_string())
print("\n")

# Bowling analysis
bowling_stats = stats_df[stats_df['Wickets'] > 0].groupby('Player Name').agg({
    'Wickets': 'sum',
    'BowlingRuns': 'sum',
    'BallsBowled': 'sum',
    'Maidens': 'sum',
    'FixtureDate': 'count'
}).round(2)

bowling_stats.columns = ['Total Wickets', 'Runs Conceded', 'Balls Bowled', 'Maidens', 'Matches']
bowling_stats['Economy'] = ((bowling_stats['Runs Conceded'] / bowling_stats['Balls Bowled']) * 6).round(2)
bowling_stats['Average'] = (bowling_stats['Runs Conceded'] / bowling_stats['Total Wickets']).round(2)
bowling_stats = bowling_stats.sort_values('Total Wickets', ascending=False)

print("TOP BOWLERS:")
print(bowling_stats.head(10).to_string())
print("\n")

# Team performance summary
print("=== TEAM PERFORMANCE SUMMARY ===")
print(f"Total Matches Played: {stats_df['fx_fixtureID'].nunique()}")
print(f"Wins: {stats_df['TotalWon'].sum()}")
print(f"Losses: {stats_df['TotalLost'].sum()}")
print(f"Draws: {stats_df['TotalDraw'].sum()}")
print(f"\nTotal Team Runs Scored: {stats_df.groupby('fx_fixtureID')['TeamRuns'].first().sum()}")
print(f"Average Team Score: {stats_df.groupby('fx_fixtureID')['TeamRuns'].first().mean():.2f}")
print("\n")

# Opposition analysis
print("=== OPPOSITION RECORD ===")
opposition_record = stats_df.groupby('Opponent').agg({
    'TotalWon': 'sum',
    'TotalLost': 'sum',
    'TotalDraw': 'sum',
    'TeamRuns': lambda x: x.iloc[0] if len(x) > 0 else 0
}).reset_index()

opposition_record.columns = ['Opponent', 'Wins', 'Losses', 'Draws', 'Last Score']
print(opposition_record.to_string(index=False))
