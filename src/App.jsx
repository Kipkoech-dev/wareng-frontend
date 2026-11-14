import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import './App.css'

const API = 'https://wareng-backend.onrender.com/api'

function Home() {
  const [buses, setBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [form, setForm] = useState({ passenger_name: '', passenger_phone: '' })
  const [pickedSeats, setPickedSeats] = useState([])
  const [createdBooking, setCreatedBooking] = useState(null)
  const [searchFrom, setSearchFrom] = useState('All')
  const navigate = useNavigate()

  const loadBuses = () => { fetch(API + '/buses/').then(r=>r.json()).then(setBuses) }
  useEffect(()=>{loadBuses()}, [])

  const openBus = (bus) => {
    setSelectedBus(bus)
    setPickedSeats([])
    setForm({ passenger_name: '', passenger_phone: '' })
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if(pickedSeats.length === 0){ alert('Please pick at least 1 seat'); return }
    const res = await fetch(API + '/bookings/', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        bus: selectedBus.id,
        passenger_name: form.passenger_name,
        passenger_phone: form.passenger_phone,
        seats_booked: pickedSeats.length,
        total_amount: pickedSeats.length * parseFloat(selectedBus.price)
      })
    })
    if(res.ok){
      const saved = await res.json()
      setCreatedBooking({ ...saved, bus_name: selectedBus.bus_name, route: selectedBus.source + ' to ' + selectedBus.destination, seats: pickedSeats.join(', ') })
      setSelectedBus(null); setPickedSeats([]); loadBuses()
    } else {
      alert('Booking failed - try again')
    }
  }

  const trackingLink = createdBooking ? window.location.origin + '/track/' + createdBooking.id : ''
  const filteredBuses = searchFrom === 'All' ? buses : buses.filter(b => b.source === searchFrom)
  const towns = ['All', 'Eldoret', 'Nairobi', 'Kisumu', 'Nakuru', 'Kitale', 'Kakamega']

  return (
    <div className="page">
      <div className="top-bar">
        <div className="logo">W</div>
        <div>
          <h1 className="title">WARENG SACCO</h1>
          <p className="subtitle">Eldoret - Nairobi - Kisumu - Nakuru - Kitale</p>
        </div>
      </div>

      <div className="track-link-wrap"><Link to="/track" className="track-link">Track My Booking</Link></div>

      <div className="search-box">
        <label>From:</label>
        <select value={searchFrom} onChange={e=>setSearchFrom(e.target.value)} className="select">
          {towns.map(t=>(<option key={t} value={t}>{t}</option>))}
        </select>
      </div>

      <p className="found">{filteredBuses.length} buses found</p>

      {filteredBuses.map(bus=>(
        <div key={bus.id} className="bus-card">
          <div>
            <strong>{bus.bus_name}</strong>
            <div className="route">{bus.source} to {bus.destination}</div>
            <div className="seats-info">{bus.available_seats}/{bus.total_seats} seats left - {bus.departure_time}</div>
          </div>
          <div className="bus-right"><div className="price">Ksh {bus.price}</div><button onClick={()=>openBus(bus)} className="btn-book">Book</button></div>
        </div>
      ))}

      {filteredBuses.length === 0 && <p className="empty">No buses for this route. Try All.</p>}

      {selectedBus && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Book {selectedBus.bus_name}</h2>
            <p className="modal-sub">{selectedBus.source} to {selectedBus.destination} - Ksh {selectedBus.price} / seat</p>
            <form onSubmit={handleBooking}>
              <input className="input" placeholder="Full Name" value={form.passenger_name} onChange={e=>setForm({...form, passenger_name:e.target.value})} required />
              <input className="input" placeholder="Phone e.g. 0712345678" value={form.passenger_phone} onChange={e=>setForm({...form, passenger_phone:e.target.value})} required />

              <p className="seat-label">Pick Your Seat(s) - Tap to select</p>
              <div className="seat-grid">
                <div className="driver">FRONT - Driver</div>
                {Array.from({length: selectedBus.total_seats}, (_, i) => {
                  const seatNum = i+1
                  const isPicked = pickedSeats.includes(seatNum)
                  return (
                    <div key={seatNum} onClick={()=>{
                      if(isPicked) setPickedSeats(pickedSeats.filter(s=>s!==seatNum))
                      else if(pickedSeats.length < 5) setPickedSeats([...pickedSeats, seatNum])
                      else alert('Max 5 seats per booking')
                    }}
                    className={isPicked ? 'seat seat-picked' : 'seat'}>
                      {seatNum}
                    </div>
                  )
                })}
              </div>
              <p className="picked-info">Picked: <strong>{pickedSeats.join(', ') || 'None'}</strong> - {pickedSeats.length} seat(s) = <strong className="green">Ksh {pickedSeats.length * parseFloat(selectedBus.price)}</strong></p>

              <div className="form-row"><button type="button" onClick={()=>setSelectedBus(null)} className="btn-cancel">Cancel</button><button type="submit" className="btn-confirm">Book {pickedSeats.length} Seat(s)</button></div>
            </form>
          </div>
        </div>
      )}

      {createdBooking && (
        <div className="modal-overlay modal-overlay-dark">
          <div className="success-card">
            <div className="big-emoji">Booking Created!</div><h2>WARENG SACCO</h2>
            <p>ID: <strong>#{createdBooking.id}</strong> - {createdBooking.route}</p>
            <p>Seats: <strong>{createdBooking.seats}</strong> - Total: <strong>Ksh {createdBooking.total_amount}</strong></p>
            <div className="link-box"><strong>Customer Tracking Link:</strong><br/>{trackingLink}</div>
            <div className="form-row">
              <button onClick={()=>{navigator.clipboard.writeText(trackingLink); alert('Link copied! Send via WhatsApp')}} className="btn-whatsapp">Copy Link</button>
              <button onClick={()=>navigate('/track/' + createdBooking.id)} className="btn-pay">Pay Now</button>
            </div>
            <button onClick={()=>setCreatedBooking(null)} className="btn-close">Close</button>
          </div>
        </div>
      )}

      <div className="footer">
        <p><strong>Wareng Sacco Offices:</strong> Eldoret Town - Uganda Road</p>
        <p>Call: 0722 000 000 | M-Pesa Till: 000000</p>
      </div>
    </div>
  )
}

function TrackPage() {
  const { id } = useParams()
  const [bookingId, setBookingId] = useState(id || '')
  const [booking, setBooking] = useState(null)
  const [mpesaStep, setMpesaStep] = useState(null)

  const fetchBooking = async (bid) => {
    const res = await fetch(API + '/bookings/' + bid + '/')
    if(res.ok){ const data = await res.json(); setBooking(data) } else { alert('Booking not found!') }
  }
  useEffect(()=>{ if(id) fetchBooking(id) }, [id])

  const payNow = async () => {
    setMpesaStep('paying')
    setTimeout(async ()=>{
      const res = await fetch(API + '/bookings/' + booking.id + '/pay/', {method:'POST'})
      const data = await res.json()
      setBooking(data.booking); setMpesaStep('success')
    }, 3000)
  }

  return (
    <div className="track-page">
      <Link to="/" className="back-link">Back to Buses</Link>
      <h1 className="track-title">Track Booking - WARENG</h1>
      {!booking && (
        <div className="track-search">
          <input className="track-input" placeholder="Enter Booking ID e.g. 15" value={bookingId} onChange={e=>setBookingId(e.target.value)} />
          <button onClick={()=>fetchBooking(bookingId)} className="btn-track">Track</button>
        </div>
      )}
      {booking && (
        <div className="booking-card">
          <div className="booking-header">
            <span className={booking.payment_status==='paid' ? 'status status-paid' : 'status status-pending'}>{booking.payment_status==='paid'?'PAID':'PENDING ' + booking.payment_status.toUpperCase()}</span>
            <span className="booking-id">ID #{booking.id}</span>
          </div>
          <h3 className="passenger-name">{booking.passenger_name}</h3>
          <p>{booking.passenger_phone}</p>
          <p>Bus ID: {booking.bus} | Seats: {booking.seats_booked} | Total: <strong className="green">Ksh {booking.total_amount}</strong></p>
          <p className="booked-date">Booked: {new Date(booking.booking_date).toLocaleString()}</p>

          <div className="steps">
            <div className="step"><div className="step-dot done">1</div><span>Booking Created</span></div>
            <div className="step"><div className={booking.payment_status==='paid' ? 'step-dot done' : 'step-dot current'}>{booking.payment_status==='paid'?'2':'2'}</div><span className={booking.payment_status!=='paid' ? 'bold' : ''}>Payment {booking.payment_status==='paid'?'Done':'Pending'}</span></div>
            <div className="step"><div className={booking.payment_status==='paid' ? 'step-dot done' : 'step-dot todo'}>3</div><span className={booking.payment_status==='paid' ? '' : 'muted'}>Ticket Ready</span></div>
          </div>

          {booking.payment_status!=='paid' && mpesaStep!=='paying' && mpesaStep!=='success' && (
            <button onClick={payNow} className="btn-mpesa">Pay Ksh {booking.total_amount} via M-Pesa</button>
          )}
          {mpesaStep==='paying' && <div className="paying-box">STK Push sent to {booking.passenger_phone}<br/>Enter PIN...<br/>Waiting...</div>}
          {booking.payment_status==='paid' && (
            <div className="ticket-box">
              <div className="big-emoji">TICKET CONFIRMED</div>
              <p>M-Pesa Code: <strong>{booking.mpesa_code}</strong></p><p className="ticket-note">Show this at boarding!</p>
              <div className="ticket-link"><strong>Share Link:</strong><br/>{window.location.href}</div>
            </div>
          )}
          <button onClick={()=>{setBooking(null); setBookingId('')}} className="btn-track-another">Track Another</button>
        </div>
      )}
    </div>
  )
}

export default function App(){
  return <BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/track" element={<TrackPage/>}/><Route path="/track/:id" element={<TrackPage/>}/></Routes></BrowserRouter>
}