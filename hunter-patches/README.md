# Patches for mamuyy/mamuyy-binance-hunter

Transport only; not part of this dashboard. Applied with `git am` on the
Hunter branches:

- `pr327-test-clock-fix.patch` → branch `ci-self-hosted-runner` (PR #327)
- `pr326-cp160-test-clock-fix.patch` → branch `cp160-klines-fallback-freshness-gate` (PR #326)

Both pin the paper engine's clock inside time-sensitive test suites so a
slow self-hosted runner crossing a 15-minute candle boundary cannot flip
results. Test code only.
