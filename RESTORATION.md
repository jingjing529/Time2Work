# Oracle production baseline

Source: https://github.com/Zavins/Time2Work at c62032588d4f8daf750885ffbff771699d1a83cd.

The running Oracle image is `130.61.18.157:5001/time2work:c620325`. All four backend files match this source after newline normalization. The eight application source files available in the deployed frontend source map also match.

Production data remains on Oracle at `/data/t2wvol` (mounted as `/code/data`). No production data was copied into this repository or changed. Historical sample JSON files are excluded.

The new Next.js application is maintained separately on branch `next-version`, in the sibling `Time2Work-next` worktree. Restoring this source does not redeploy or restart Oracle.
