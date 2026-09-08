# Archive — the daily corridor schedule

Screen 01 was originally a **ten-day dispatch board**: a daily Gantt of 17 transport
orders with vessel nominations, a live telematics feed and a now-line. It was replaced
by a monthly schedule across the 30-year horizon, because `components/capabilities/works.js`
work 04 describes TRAMOS as a cost-estimation and budgeting product — *"cost modelling for
multi-leg transport networks, over a thirty-year horizon"* — and a dispatch board depicts
the wrong category of product. The field labelled `Horizon` read `06 – 15 Feb 2026`.

Kept here so the daily board can be restored or shown alongside:

| File | What it is |
|---|---|
| `gen-tramos-daily.mjs` | Generator that emits all three daily-horizon views |
| `shell.css` | The shell as it stood at that point |
| `corridor-schedule-daily.html` | Screen 01 exactly as it rendered |
| `corridor-schedule-1440x900@2x.png` | Its capture |

`gen-tramos-daily.mjs` is a reconstruction: the original generator was lost with a
session scratchpad, and this was rebuilt from the emitted HTML plus the invariants in
`../../verify-logistics.mjs`. It reproduces every rendered figure except the two
tonne-kilometre totals on view 3 — the original per-lane kilometres were not recoverable
from anything on screen, so they were re-authored and the totals moved from
8,568,900 / 3,397,600 to 8,755,500 / 3,995,400 t·km.

To run it, copy it back over `../gen-tramos.mjs` with this `shell.css`.
