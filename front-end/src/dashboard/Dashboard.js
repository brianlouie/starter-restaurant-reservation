import React, { useEffect, useState } from "react";
import {
  listReservations,
  finishTable,
  updateReservationStatus,
} from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import { useHistory, Link } from "react-router-dom";
import { today } from "../utils/date-time";

/**
 * Defines the dashboard page.
 * @param date
 *  the date for which the user wants to view reservations.
 * @returns {JSX.Element}
 */
function Dashboard({ date, tables, tablesError, loadTables }) {
  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);
  let searchParams = new URLSearchParams(document.location.search);
  const history = useHistory();

  useEffect(loadDashboard, [date]);

  function loadDashboard() {
    let searchParams = new URLSearchParams(document.location.search);
    const abortController = new AbortController();
    setReservationsError(null);
    if (searchParams.get("date")) {
      let date = searchParams.get("date");
      listReservations({ date }, abortController.signal)
        .then(setReservations)
        .catch(setReservationsError);
      return () => abortController.abort();
    }
    listReservations({ date }, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);
    return () => abortController.abort();
  }

  function incrementDate(dateInput, increment) {
    var dateFormatTotime = new Date(dateInput + " 00:00");
    var increasedDate = new Date(
      dateFormatTotime.getTime() + increment * 86400000
    );
    return increasedDate;
  }

  function formatDate(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  function previousHandler() {
    let dateValue = searchParams.get("date");
    if (!dateValue) dateValue = today();
    const previousDate = incrementDate(dateValue, -1);
    history.push(`/dashboard?date=${formatDate(previousDate)}`);
  }

  function nextHandler() {
    let dateValue = searchParams.get("date");
    if (!dateValue) dateValue = today();
    const nextDate = incrementDate(dateValue, 1);
    history.push(`/dashboard?date=${formatDate(nextDate)}`);
  }

  function todayHandler() {
    history.push(`/dashboard`);
    date = today();
  }

  function cancelReservationButtonHandler(reservation_id) {
    if (
      window.confirm(
        "Do you want to cancel this reservation? This cannot be undone."
      )
    ) {
      const abortController = new AbortController();
      updateReservationStatus(
        reservation_id,
        "cancelled",
        abortController.signal
      )
        .then(loadDashboard)
        .catch(setReservationsError);
    } else {
    }
  }

  const reservationRows = reservations.map((reservation) => (
    <tr key={reservation.reservation_id}>
      <th scope="row">{reservation.reservation_id}</th>
      <td>{reservation.first_name}</td>
      <td>{reservation.last_name}</td>
      <td>{reservation.mobile_number}</td>
      <td>{reservation.reservation_date}</td>
      <td>{reservation.reservation_time}</td>
      <td>{reservation.people}</td>
      <td data-reservation-id-status={reservation.reservation_id}>
        {reservation.status}
      </td>
      {reservation.status === "booked" ? (
        <>
          <td>
            <Link
              to={`/reservations/${reservation.reservation_id}/seat`}
              className="btn btn-secondary"
            >
              Seat
            </Link>
          </td>
          <td>
            
            <Link
              to={`/reservations/${reservation.reservation_id}/edit`}
              className="btn btn-secondary"
            >
              Edit
            </Link>
          </td>
        </>
      ) : (
        <>
          <td></td>
          <td></td>
        </>
      )}
      {reservation.status !== "finished" &&
      reservation.status !== "cancelled" ? (
        <td>

          <button
            data-reservation-id-cancel={reservation.reservation_id}
            onClick={() =>
              cancelReservationButtonHandler(reservation.reservation_id)
            }
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </td>
      ) : (
        <>
          <td></td>
        </>
      )}
    </tr>
  ));

  function finishButtonHandler(table_id, reservation_id) {
    if (
      window.confirm(
        "Is this table ready to seat new guests? This cannot be undone."
      )
    ) {
      finishTable(table_id)
        .then(loadTables)
        .then(loadDashboard)
        .catch(setReservationsError);
    } else {
    }
  }

  const tableRows = tables.map((table) => (
    <tr key={table.table_id}>
      <th scope="row">{table.table_id}</th>
      <td>{table.table_name}</td>
      <td>{table.capacity}</td>
      <td data-table-id-status={table.table_id}>
        {table.reservation_id ? "Occupied" : "Free"}
      </td>
      {table.reservation_id ? (
        <td>
          <button
            data-table-id-finish={table.table_id}
            type="button"
            className="btn btn-secondary mr-2"
            onClick={() =>
              finishButtonHandler(table.table_id, table.reservation_id)
            }
          >
            Finish
          </button>
        </td>
      ) : (
        <td></td>
      )}
    </tr>
  ));

  return (
    <main>
      <h1>Dashboard</h1>
      <div className="d-md-flex mb-3">
        <h4 className="mb-0">
          Reservations for date{" "}
          {searchParams.get("date") ? searchParams.get("date") : today()}
        </h4>
        <button
          type="button"
          className="btn btn-secondary mr-2"
          onClick={previousHandler}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-secondary mr-2"
          onClick={todayHandler}
        >
          Today
        </button>
        <button
          type="button"
          className="btn btn-secondary mr-2"
          onClick={nextHandler}
        >
          Next
        </button>
      </div>
      <ErrorAlert error={reservationsError} />
      <table className="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">First Name</th>
            <th scope="col">Last Name</th>
            <th scope="col">Mobile Number</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">People</th>
            <th scope="col">Status</th>
            <th scope="col">Reserve Table</th>
            <th scope="col">Change Reservation</th>
            <th scope="col">Cancel Reservation</th>
          </tr>
        </thead>
        <tbody>{reservationRows}</tbody>
      </table>
      <ErrorAlert error={tablesError} />
      <h4>Tables</h4>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Table Name</th>
            <th scope="col">Capacity</th>
            <th scope="col">Status</th>
            <th scope="col">Clear Table</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
    </main>
  );
}

export default Dashboard;
