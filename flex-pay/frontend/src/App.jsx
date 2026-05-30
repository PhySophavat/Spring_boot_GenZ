import { useEffect, useState } from 'react'

export default function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/')
      .then((r) => {
        if (!r.ok) throw new Error('Network response was not ok')
        return r.text()
      })
      .then((t) => setMessage(t))
      .catch(() => setMessage('Failed to reach backend'))
  }, [])

  return (
    <div style={{fontFamily:'Arial, sans-serif',padding:20}}>
      <h2>FlexPay Frontend</h2>
      <div dangerouslySetInnerHTML={{__html: message}} />
    </div>
  )
}
