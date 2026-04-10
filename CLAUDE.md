# InsiderRadar — Project CLAUDE.md

## What This Project Is
A free SEC insider trading and institutional fund flow tracker.
Monetized via Ezoic ads. Built to rank for "free SEC insider trading tracker" and related queries.

## Data Sources
- SEC EDGAR Form 4: https://efts.sec.gov/LATEST/search-index?forms=4
- SEC Company Submissions: https://data.sec.gov/submissions/CIK{cik}.json
- SEC Full Text Search: https://efts.sec.gov/LATEST/search-index
- Cache all SEC responses for 1 hour minimum to avoid rate limits

## Domain
insiderradar.com (check availability)

## Environment Variables
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_UMAMI_ID=
