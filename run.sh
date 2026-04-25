#!/bin/bash
echo "============================================"
echo "  SURVEILENCEMAXXING — Starting Dashboard  "
echo "============================================"
pip install -r requirements.txt -q
echo ""
echo "Starting server at http://localhost:5050"
echo "Press Ctrl+C to stop."
echo ""
python app.py
