How to rebuild the local solver package (includes testcase_gui.py)

1. Ensure Node dependencies are installed:

   npm install

2. Put your full `testcase_gui.py` in `public/local-solver-package/` (the repository now includes a placeholder file).

3. Run the build script to generate `public/local-solver-package.zip`:

   npm run build-local-solver

4. The web UI serves this ZIP at `/api/download/local-solver`.

Notes:
- The package includes `testcase_gui.py` so when you download and run the local solver package, FastAPI can import and execute the real solver.
- If FastAPI still reports `testcase_gui.Solve_test_case returned: None`, the external solver might be executing but returning None; you'll need to run its entrypoint locally to debug why it returns None for your input case.