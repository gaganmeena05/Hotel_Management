import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './createClient';
import './App.css';
import { dayjs } from "../lib/dayjs";
function App() {

  const [data, setdata] = useState([]);
  const [datar, setdatar] = useState([]);
  const [displayData, setdisplayData] = useState([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [email, setEmail] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [roomNumberFilterValue, setRoomNumberFilterValue] = useState("");
  const [roomTypeFilterValue, setRoomTypeFilterValue] = useState("");
  const [startTimeValue, setstartTimeValue] = useState("");
  const [endTimeValue, setendTimeValue] = useState("");
  const [entryId, setentryId] = useState("");
  const [filt, setfilt] = useState(false);


  useEffect(() => {
    fetchData();
    fetchDataRoom();
  }, []);

  async function fetchDataRoom() {  //function used to fetch data
    const { data } = await supabase.from('Rooms').select('*');
    console.log(data)
    setdatar(data);
  }


  async function fetchData() {  //function used to fetch data
    const { data } = await supabase.from('Bookings').select('*,Rooms(room_id,room_type)');
    setdata(data);
  }

  //hook to sync data displayed to user and data received from server
  useEffect(() => {
    setdisplayData(data);
  }, [data]);

  //filter
  useEffect(() => {
    if (roomNumberFilterValue === "" && roomTypeFilterValue === "" && startTimeValue === "" && endTimeValue === "") {
      setdisplayData(data);
      return;
    }

    let filt = data;
    filt = roomNumberFilterValue !== "" ? filt.filter(({ room_number }) => {
      return room_number == roomNumberFilterValue
    }) : filt


    filt = roomTypeFilterValue !== "" ? filt.filter(({ Rooms: { room_type } }) => {
      return room_type == roomTypeFilterValue
    }) : filt

    filt = startTimeValue !== "" ? filt.filter(({ start_time }) => {
      return dayjs(startTimeValue).diff(start_time, 's') <= 0;
    }) : filt


    filt = endTimeValue !== "" ? filt.filter(({ end_time }) => {
      return dayjs(endTimeValue).diff(end_time, 's') >= 0;
    }) : filt

    setdisplayData(filt);

  }, [roomNumberFilterValue, startTimeValue, endTimeValue, roomTypeFilterValue, setdisplayData, data])

  //function to delete entry from Bookings
  async function deletebooking(entryId) {
    const t = dayjs(entryId.start_time).diff(dayjs(), 'hours');
    let isConfirmed = 0;
    if (t > 48) {
      isConfirmed = window.confirm(`If confirmed c refund of ${entryId.cost} Rs. will be provided \nAre you sure you want to cancel?`);
    } else if (t <= 48 && t >= 24) {
      isConfirmed = window.confirm(`If confirmed h refund of ${entryId.cost / 2} Rs. will be provided \nAre you sure you want to cancel?`);
    }
    else if (t >= 0 && t < 24) {
      isConfirmed = window.confirm(`If confirmed no refund will be provided \nAre you sure you want to cancel?`);
    }
    if (isConfirmed) {
      const { data, error } = await supabase.from('Bookings').delete().eq('id', entryId.id)
      fetchData()
    }
  }

  function editbooking(entryId) {
    setentryId(entryId.id) //edits booking details
    setRoomNumber(entryId.room_number);
    setEmail(entryId.email);
    setStartTime(entryId.start_time);
    setEndTime(entryId.end_time);
  }

  const refClose = useRef(null)
  const [bookingInfo, setBookingInfo] = useState({
    email: email,
    roomNumber: roomNumber,
    checkInDate: dayjs(startTime).format('h:mm A DD/MM/YY'),
    checkOutDate: dayjs(endTime).format('h:mm A DD/MM/YY'),
  });

  async function createbooking(e) { //function to create entry for Bookings

    e.preventDefault();
    if (dayjs(startTime).diff(dayjs(), 'hours') <= 0) {
      alert("Start time must be 1 hour after current time ");
      return;
    }
    if (dayjs(endTime).diff(dayjs(), 'hours') <= 0) {
      alert("End time must be 1 hour after current time ");
      return;
    }
    if (dayjs(endTime).diff(startTime, 'hours') <= 0) {
      alert("Start time must be less than End time ");
      return;
    }

    const isOverlapping = data.some((entry) => {  // checking for overlapping
      const newStart = dayjs(startTime);
      const newEnd = dayjs(endTime);
      const existingStart = dayjs(entry.start_time);
      const existingEnd = dayjs(entry.end_time);

      return (
        ((dayjs(newStart).isBetween(existingStart, existingEnd, 'hour', '[]')) ||
          (dayjs(newEnd).isBetween(existingStart, existingEnd, 'hour', '[]'))) &&
        (entry.room_number === roomNumber)
      );
    });

    if (!isOverlapping) { //if overlapping is not present then insert the data
      const { data } = await supabase.from('Rooms').select('room_type').eq('room_id', roomNumber);
      let { data: dataCost } = await supabase.from('Room Type').select('cost').eq('id', data[0].room_type);
      const { error } = await supabase.from('Bookings').insert({ room_number: roomNumber, email, start_time: startTime, end_time: endTime, cost: dataCost[0].cost * dayjs(endTime).diff(startTime, 'hours') });
      if (error) {
        alert('Error occured');
        return;
      }
      fetchData();
      refClose.current.click()
    } else {
      alert('Overlap detected! Entry not added.');
      return;
    }
  }

  async function updatebooking(e) { //function to update entry on Bookings
    e.preventDefault();
    const { data } = await supabase.from('Rooms').select('room_type').eq('room_id', roomNumber);
    let { data: dataCost } = await supabase.from('Room Type').select('cost').eq('id', data[0].room_type);
    const { error } = await supabase
      .from('Bookings')
      .update({ room_number: roomNumber, email, start_time: startTime, end_time: endTime, cost: dataCost[0].cost * dayjs(endTime).diff(startTime, 'hours') })
      .eq('id', entryId);
    fetchData();
  }

  return (
    <div style={{ width: '100dvw', padding: '2rem' }}>
      <div className="d-inline">

        <button className='btn btn-primary' style={{ margin: '0 0 2rem 0' }} onClick={() => setfilt(!filt)}> Filter </button><br></br>
        {filt &&
          (<span className="d-inline" style={{ display: 'flex', flexDirection: 'column', margin: '2rem', flexGrow: 1, alignItems: 'center' }}>
            <label htmlFor="room_number_filter">Filter By Room Number</label>
            <input type="text" name="room_number_filter" id="room_number_filter" style={{ width: '50%' }} value={roomNumberFilterValue} onChange={(e) => setRoomNumberFilterValue(e.currentTarget.value)} />
            <label htmlFor="start_time_filter">Filter By Start Time</label>
            <input type="datetime-local" name="start_time_filter" id="start_time_filter" value={startTimeValue} style={{ width: '50%' }} onChange={(e) => setstartTimeValue(e.currentTarget.value)} />
            <label htmlFor="room_number_filter">Filter By Room Type</label>
            <input type="text" name="room_type_filter" id="room_type_filter" value={roomTypeFilterValue} style={{ width: '50%' }} onChange={(e) => setRoomTypeFilterValue(e.currentTarget.value)} />
            <label htmlFor="end_time_filter">Filter By End Time</label>
            <input type="datetime-local" name="end_time_filter" id="end_time_filter" value={endTimeValue} style={{ width: '50%' }} onChange={(e) => setendTimeValue(e.currentTarget.value)} />
          </span>)}
      </div>

      <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#exampleModal">
        Add New Entry
      </button>

      <div className="modal fade" id="exampleModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" id="exampleModalLabel" style={{ textAlign: 'center' }}>Add Entry</h2>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={createbooking}>
                start_time : <input type="datetime-local" name="start_time" style={{ margin: '0 2rem 0 0' }} value={startTime} onChange={(e) => setStartTime(e.currentTarget.value)} required />
                end_time :  <input type="datetime-local" name="end_time" style={{ margin: '0 2rem 0 0' }} value={endTime} onChange={(e) => setEndTime(e.currentTarget.value)} required />

                <div className="input-group mb-3 d-inline" style={{ margin: '1rem 2rem 0 0' }}>
                  Room No. :
                  <select className="form-control" style={{ margin: '0 2rem 1rem 0' }} placeholder="Room Number" type="number" name="room_number" value={roomNumber} onChange={(e) => setRoomNumber(e.currentTarget.value)} required >
                    {datar.length > 0 && datar.map((room) => {
                      return <option key={room.room_id} value={room.room_id}>{room.room_id}</option>
                    })}
                  </select>
                  <br />
                  Email : <input className="form-control" style={{ margin: '0rem 2rem 0 0' }} placeholder="Email" type="email" name='email' value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
                </div>
                <hr>
                </hr>
                <button type="button" className="btn btn-secondary" style={{ margin: '0 2rem 0 0' }} data-dismiss="modal" ref={refClose} >Close</button>
                <button type="submit" className="btn btn-primary">Save changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>


      <div className="modal fade" id="example" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" id="exampleModalLabel" style={{ textAlign: 'center' }}>Edit Entry</h2>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={updatebooking}>
                Room Number :
                <select className="form-control" style={{ margin: '0 2rem 1rem 0' }} placeholder="Room Number" type="number" name="room_number" value={roomNumber} onChange={(e) => setRoomNumber(e.currentTarget.value)} required >
                  {datar.length > 0 && datar.map((room) => {
                    return <option key={room.room_id} value={room.room_id}>{room.room_id}</option>
                  })}
                </select><br></br>
                email : <input type="email" name='email' value={email} style={{ margin: '0 2rem 1rem 0', width: '60%' }} onChange={(e) => setEmail(e.currentTarget.value)} required /><br></br>
                start_time : <input type="datetime-local" name="start_time" value={startTime} style={{ margin: '0 2rem 1rem 0', width: '60%' }} onChange={(e) => setStartTime(e.currentTarget.value)} required /><br />
                end_time :  <input type="datetime-local" name="end_time" value={endTime} style={{ margin: '0 2rem 1rem 0', width: '60%' }} onChange={(e) => setEndTime(e.currentTarget.value)} required /><br />
                <hr></hr><button type='submit'> Update </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th scope="col" >Room Type</th>
            <th scope="col" >Room Number</th>
            <th scope="col" >Users Email</th>
            <th scope="col" >Start Time</th>
            <th scope="col" >End Time</th>
            <th scope="col" >Duration</th>
            <th scope="col" >Cost</th>
            <th scope="col" >Action</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((d) =>
            <tr key={d.id}>
              <td> {d.Rooms.room_type} </td>
              <td>{d.room_number}</td>
              <td>{d.email}</td>
              <td>{dayjs(d.start_time).format('h:mm A DD/MM/YYYY')}</td>
              <td>{dayjs(d.end_time).format('h:mm A DD/MM/YYYY')}</td>
              <td>{dayjs(d.end_time).diff(d.start_time, 'hours')} hours</td>
              <td>{d.cost} Rs.</td>
              <td> <button className='btn btn-danger' onClick={(e) => { deletebooking(d) }} style={{ margin: '0 2rem 0 0' }}>DELETE</button>
                <button data-toggle="modal" className='btn btn-info' data-target="#example" onClick={(e) => { editbooking(d) }}>EDIT</button> </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default App

