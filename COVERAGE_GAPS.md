# Coverage Gaps

Current coverage (unit + integration only, E2E excluded):
- **Statements:** 43.1%
- **Branches:** 37.1%
- **Functions:** 40.0%
- **Lines:** 43.5%

## controller.ts (35% statements)

| Lines | Code | E2E Covered? |
|-------|------|--------------|
| 120–215 | `modem` subsystem: `get_cells_info`, `get_info`, `get_sms_list`, `get_status`, `get_tower_info`, `send_at_command`, `send_sms` | ✅ Yes — `refresh.test.ts` calls `controller.refresh()` which hits all of these |
| 216–234 | `system` subsystem: `get_info`, `get_status`, `reboot` | ✅ Yes — same flow |
| 236–263 | `refresh()` and `publish()` | ✅ Yes — `refresh.test.ts` |
| **311–317** | **Login retry on "Login fail number over limit"** | ❌ **Genuine gap** — mock router always succeeds, this branch never fires |

## mqtt.ts (45% statements)

| Lines | Code | E2E Covered? |
|-------|------|--------------|
| 51–74 | MQTT message handler (HA command callbacks: `set_sms_msg`, `set_sms_to`, `send_sms`, `restart`) | ✅ Yes — `mqtt.test.ts` (was failing due to broker issue) |
| 80–112 | Background polling loop + `stopPolling()` + `disconnect()` | ✅ Yes — same MQTT scenario |

## Notes

Most of the "uncovered" code is actually covered by E2E tests but not reported because `vitest.config.ts` excludes `src/__tests__/e2e/**` from coverage. Only the login retry branch is a genuine gap.

## Options

- **Raise thresholds** — current thresholds (30/25/35) are so low they provide no quality gate. More meaningful levels might be 80/70/75.
- **Include E2E in coverage** — remove the E2E exclude so coverage reflects actual tested code. Tradeoff: E2E failures would also block coverage.
- **Add a unit test for the login retry branch** — small, focused, would close the only genuine gap.
