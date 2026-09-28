async function check() {
  const res = await fetch('http://localhost:3000')
  const html = await res.text()
  const links = html.match(/<link[^>]+>/g) || []
  const iconLinks = links.filter(l => l.includes('icon'))
  console.log('Icon links found in HTML:', iconLinks)
}
check()
