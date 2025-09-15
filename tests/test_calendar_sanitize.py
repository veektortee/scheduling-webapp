import calendar as pycalendar


def sanitize_calendar_like_bridge(calendar_obj):
    """
    Copy of the bridge's _sanitize_calendar logic for a unit test.
    It clamps out-of-range day numbers to the month's last day and skips invalid entries.
    """
    if not calendar_obj:
        return calendar_obj

    days = calendar_obj.get('days')
    if not isinstance(days, list):
        return calendar_obj

    cleaned = []
    for idx, d in enumerate(days):
        if not isinstance(d, str):
            continue
        parts = d.split('-')
        if len(parts) != 3:
            continue
        try:
            y = int(parts[0])
            m = int(parts[1])
            dd = int(parts[2])
        except Exception:
            continue

        if m < 1 or m > 12:
            continue

        last_day = pycalendar.monthrange(y, m)[1]
        if dd < 1:
            continue
        if dd > last_day:
            corrected = f"{y:04d}-{m:02d}-{last_day:02d}"
            cleaned.append(corrected)
        else:
            cleaned.append(f"{y:04d}-{m:02d}-{dd:02d}")

    new_cal = dict(calendar_obj)
    new_cal['days'] = cleaned
    return new_cal


def test_sanitize_clamps_invalid_day():
    cal = {'days': ['2025-09-30', '2025-09-31', '2025-10-01']}
    out = sanitize_calendar_like_bridge(cal)
    assert '2025-09-31' not in out['days']
    # September 2025 has 30 days, so 2025-09-31 should become 2025-09-30
    assert '2025-09-30' in out['days']
    assert '2025-10-01' in out['days']


def test_sanitize_skips_malformed_entries():
    cal = {'days': ['not-a-date', '2025-13-01', '2025-00-10', 123]}
    out = sanitize_calendar_like_bridge(cal)
    # All entries invalid -> cleaned list should be empty
    assert out['days'] == []
