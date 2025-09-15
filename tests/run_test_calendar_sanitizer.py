import importlib.util
from pathlib import Path


def _load_advanced_solver():
    svc_path = Path(__file__).resolve().parents[1] / 'public' / 'local-solver-package' / 'fastapi_solver_service.py'
    spec = importlib.util.spec_from_file_location('fastapi_solver_service', str(svc_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.AdvancedSchedulingSolver


def main():
    AdvancedSchedulingSolver = _load_advanced_solver()
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
    assert cleaned['days'][2] == '2025-09-30'
    assert cleaned['days'][3] == '2025-10-01'
    print('Sanitizer test passed')


if __name__ == '__main__':
    main()
