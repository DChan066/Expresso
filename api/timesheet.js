const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// When a timesheet id is given, check whether a timesheet with that id exists in the database
// If timesheet exists, set req.timesheet to the query result and call next()
// Else, return a status code of 404 Not Found
timesheetsRouter.param('timesheetId', (req, res, next, id) => {
  db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err, row) => {
    if (row) {
      req.timesheet = row;
      next();
    }
    else {
      return res.sendStatus(404);
    }
  });
});

// api/employees/:employeeId/timesheets

// employeesRouter.param checks for existing employees.  See employee.js

// GET
// Returns a 200 response containing all saved timesheets related to the employee with the supplied employee ID on the timesheets property of the response body
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
timesheetsRouter.get('', (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`, (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send({timesheets: rows});
    }
  });
});

// Checks that requests to create or modify a timesheet have all required fields filled with valid inputs
const validateTimesheet = (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date ) {
    return res.sendStatus(400);
  }
  next();
}

// POST
// Creates a new timesheet, related to the employee with the supplied employee ID, with the information from the timesheet property of the request body and saves it to the database. Returns a 201 response with the newly-created timesheet on the timesheet property of the response body
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
timesheetsRouter.post('', validateTimesheet, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  db.run(`INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)`,
  {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employee_id: req.params.employeeId
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(201).send({timesheet: row});
    });
  });
});

// /api/employees/:employeeId/timesheets/:timesheetId

// PUT
// Updates the timesheet with the specified timesheet ID using the information from the timesheet property of the request body and saves it to the database. Returns a 200 response with the updated timesheet on the timesheet property of the response body
// If any required fields are missing, returns a 400 response
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
// If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
timesheetsRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  db.run(
    `UPDATE Timesheet
  SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id
  WHERE id = $timesheetId`,
  {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employee_id: req.params.employeeId,
    $timesheetId: req.params.timesheetId
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).send({timesheet: row});
    });
  });
});

// DELETE
// Deletes the timesheet with the supplied timesheet ID from the database. Returns a 204 response.
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
// If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  db.run(
    `DELETE FROM Timesheet WHERE id = ${req.params.timesheetId}`,
    function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      res.sendStatus(204);
    });
});

module.exports = timesheetsRouter;
