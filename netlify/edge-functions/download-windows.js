/**
 * Dynamically resolves the Windows download URL from the latest GitHub release.
 * Finds the .exe asset and redirects to it, so the filename in netlify.toml
 * never needs updating when the desktop app version changes.
 */
export default async () => {
  try {
    const res = await fetch(
      'https://api.github.com/repos/Morayya-Jain/BrainDock/releases/latest',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'BrainDock-Website',
        },
      }
    )

    if (!res.ok) {
      return Response.redirect(
        'https://github.com/Morayya-Jain/BrainDock/releases/latest',
        302
      )
    }

    const release = await res.json()
    const exe = release.assets.find((a) => a.name.endsWith('.exe'))

    if (exe) {
      return Response.redirect(exe.browser_download_url, 302)
    }

    return Response.redirect(
      'https://github.com/Morayya-Jain/BrainDock/releases/latest',
      302
    )
  } catch {
    return Response.redirect(
      'https://github.com/Morayya-Jain/BrainDock/releases/latest',
      302
    )
  }
}
