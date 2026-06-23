# Global Terrorism

Single-page scrollytelling visualization of global terrorism attacks recorded
between **2020-11-26 and 2020-12-31** (35 days, 700 events).

**Data source:** CnOpenData — global terrorism attack dataset.

The deployed entry point is `index.html`. All data is precomputed into
`assets/9e157022-e668-43cc-a2c6-139f99878a01.js` (`TERROR_DATA`); charts are
rendered with ECharts.

## Sections

1. 坠落的余烬 — per-attack scatter over time (Y = single-event casualties)
2. 起伏的伤亡 — daily killed/injured trend with peak annotation
3. 数字背后的生命 — isotype (one icon = 10 people)
4. 暴力的版图 — world map of attack hotspots
5. 暴力的网络 — perpetrator → country force graph (edge width = attack count)
6. 暴力的工具 — weapon-type infographic
7. 暴力的手法 — attack-type distribution
8. 谁是靶心？ — target-type distribution
9. 最常见 ≠ 最致命 — attack frequency vs. deaths per attack
