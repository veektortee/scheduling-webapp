import json
from public.local_solver_package.fastapi_solver_service import AdvancedSchedulingSolver


def test_sanitize_clamps_out_of_range_days():
    srv = AdvancedSchedulingSolver()
    cal = {
        'days': [
            '2025-09-29',
            '2025-09-30',
            '2025-09-31',  # invalid -> should be clamped to 2025-09-30
            '2025-10-01'
        ]
    }

    cleaned = srv._sanitize_calendar(cal)
    assert 'days' in cleaned
    assert cleaned['days'][0] == '2025-09-29'
    assert cleaned['days'][1] == '2025-09-30'
    # the invalid day should be clamped to 2025-09-30
    assert cleaned['days'][2] == '2025-09-30'
    assert cleaned['days'][3] == '2025-10-01'
