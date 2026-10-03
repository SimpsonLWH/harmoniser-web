Copies of `esp32-companion/tests/vectors/` (the firmware's own test vectors), so the relay's
port of `json_scan()`, `utf8_valid()` and `copy_label()` is held to the same cases as the C
code and the Python mock. `tests/core.vectors.test.ts` fails if a copy differs from the
original while the firmware repository sits next to this one.
