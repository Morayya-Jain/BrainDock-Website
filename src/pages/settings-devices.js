/**
 * Linked devices: list and unlink. Reads from devices table, delete to unlink.
 */

import { supabase } from '../supabase.js'
import { initDashboardLayout } from '../dashboard-layout.js'

async function loadDevices() {
  const { data, error } = await supabase.from('devices').select('*').order('last_seen', { ascending: false })
  if (error) throw error
  return data || []
}

async function unlinkDevice(deviceId) {
  const { error } = await supabase.from('devices').delete().eq('id', deviceId)
  if (error) throw error
}

function formatRelativeTime(iso) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const sec = Math.floor((now - d) / 1000)
  if (sec < 60) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`
  return d.toLocaleDateString()
}

function escapeHtml(str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function render(main, devices) {
  const base = window.location.origin

  main.innerHTML = `
    <h1 class="dashboard-page-title">Linked Devices</h1>
    <p class="dashboard-page-subtitle">
      Devices where you have signed in with BrainDock. Unlinking will require signing in again on that device.
    </p>

    <div class="dashboard-card">
      ${devices.length === 0
        ? `
        <div class="dashboard-empty">
          <p class="dashboard-empty-title">No linked devices</p>
          <p>Download BrainDock and sign in to link a device.</p>
          <a href="${base}/download/" class="btn btn-primary dashboard-empty-cta">Download BrainDock</a>
        </div>
        `
        : `
        <ul class="dashboard-list">
          ${devices.map((d) => `
            <li class="dashboard-list-item" data-device-id="${escapeHtml(d.id)}">
              <div>
                <strong>${escapeHtml(d.device_name || d.machine_id || 'Unknown device')}</strong><br>
                <span class="dashboard-meta">${escapeHtml(d.os || '')} &middot; Last active: ${formatRelativeTime(d.last_seen)}</span><br>
                <span class="dashboard-meta-sub">App version: ${escapeHtml(d.app_version || '-')}</span>
              </div>
              <button type="button" class="btn btn-secondary dashboard-btn-sm device-unlink-btn">Unlink</button>
            </li>
          `).join('')}
        </ul>
        `}
      <p class="dashboard-meta dashboard-devices-footer">
        To link a new device, download BrainDock and sign in with your account.
      </p>
      <a href="${base}/download/" class="btn btn-secondary dashboard-devices-download-link">Download BrainDock</a>
    </div>
  `

  main.querySelectorAll('.device-unlink-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const li = btn.closest('[data-device-id]')
      const id = li?.dataset.deviceId
      if (!id || !confirm('Unlink this device? You will need to sign in again on it.')) return
      btn.disabled = true
      try {
        await unlinkDevice(id)
        li.remove()
      } catch (err) {
        console.error(err)
        alert('Failed to unlink. Please try again.')
        btn.disabled = false
      }
    })
  })
}

async function main() {
  const result = await initDashboardLayout()
  if (!result) return

  const mainEl = document.querySelector('.dashboard-main')
  if (!mainEl) return

  mainEl.innerHTML = '<div class="dashboard-loading"><div class="dashboard-spinner"></div><p>Loading devices...</p></div>'

  try {
    const devices = await loadDevices()
    render(mainEl, devices)
  } catch (err) {
    console.error(err)
    mainEl.innerHTML = `
      <div class="dashboard-empty">
        <p class="dashboard-empty-title">Could not load devices</p>
        <p>${escapeHtml(err.message || 'Please try again.')}</p>
      </div>
    `
  }
}

main()
