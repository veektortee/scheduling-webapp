import traceback
from fastapi_solver_service import AdvancedSchedulingSolver

try:
    solver = AdvancedSchedulingSolver()

    # Minimal synthetic case: 30 consecutive days, 5 shifts, 2 providers
    from datetime import date, timedelta

    start_day = date(2025, 9, 10)
    days = [(start_day + timedelta(days=i)).isoformat() for i in range(30)]

    shifts = []
    for i in range(5):
        shift_date = (start_day + timedelta(days=i)).isoformat()
        shifts.append({
            'id': f's{i}',
            'date': shift_date,
            'type': 'A',
            'start': '08:00',
            'end': '16:00'
        })

    providers = [
        {'name': 'Prov1', 'type': 'MD', 'max_consecutive_days': 12},
        {'name': 'Prov2', 'type': 'Staff', 'max_consecutive_days': 1000}
    ]

    case = {
        'constants': {},
        'calendar': {'days': days},
        'shifts': shifts,
        'providers': providers,
        'run': {'k': 1, 'seed': 1}
    }

    res = solver._build_and_solve_model(case['constants'], case['calendar'], case['shifts'], case['providers'], case['run'], 'test-run')

    print('Status:', res.get('solver_status'))
    print('Solutions found:', res.get('solutions_found'))
    print('Statistics keys:', list(res.get('statistics', {}).keys()))

except Exception as e:
    print('Exception during smoke test:')
    traceback.print_exc()
