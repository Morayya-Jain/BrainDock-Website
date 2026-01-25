# BrainDock

A local AI-powered focus tracker that monitors presence and **gadget distractions** via webcam, logs events, and generates PDF reports.

## Features

- **Desktop GUI**: Modern, minimal interface with Start/Stop button, status indicator, and timer
- **AI-Powered Detection**: Uses OpenAI Vision API to detect person presence and gadget distractions
- **Smart Gadget Detection**: Detects device usage based on attention + active engagement (not physical position)
  - Detects: Phones, tablets/iPads, game controllers, Nintendo Switch, TV, etc.
  - Detects: Person actively using any gadget (looking at it + device active)
  - Ignores: Gadget on desk but person looking elsewhere, or device inactive
  - Ignores: Smartwatches/Apple Watch (used for time/notifications, not distractions)
- **Session Analytics**: Computes focused time, away time, and gadget usage statistics
- **PDF Reports**: Professional combined PDF with summary statistics and full session logs
- **Privacy-Conscious**: We capture frames for analysis; we don't store them locally. See [OpenAI's retention policy](https://openai.com/policies/api-data-usage-policies)

**GUI Mode:**
1. Click "Start Session" to begin
2. The status indicator shows your current state
3. Click "Stop Session" when done
4. Click "Generate Report" to create your PDF

**CLI Mode:**
1. Press Enter to start a focus session
2. The app monitors your presence via webcam
3. Events are logged (present, away, gadget_suspected)
4. Press 'q' or Enter to end the session
5. A PDF report is automatically generated

**Reports include:**
- Page 1: Session statistics (duration, focus rate, time breakdown)
- Page 2+: Complete timeline of all events (showing when you were focused/away/distracted)