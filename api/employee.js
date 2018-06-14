const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheet.js');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// When an employee id is given, check whether an employee with that id exists in the database
// If employee exists, set req.employee to the query result and call next()
// Else, return a status code of 404 Not Found
employeesRouter.param('employeeId', (req, res, next, id) => {
  db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
    if (row) {
      req.employee = row;
      next();
    }
    else {
      return res.sendStatus(404);
    }
  });
});

// Timesheet-related endpoints are handled in timesheet.js
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

// /api/employees

// GET
// Returns a 200 response containing all saved currently-employed employees (is_current_employee is equal to 1) on the employees property of the response body
employeesRouter.get('', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send({employees: rows});
    }
  });
});

// Checks that requests to create or modify an employee have all required fields filled with valid inputs
const validateEmployee = (req, res, next) => {
  const newEmployee = req.body.employee;
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage ) {
    return res.sendStatus(400);
  }
  next();
}

// POST
// Creates a new employee with the information from the employee property of the request body and saves it to the database. Returns a 201 response with the newly-created employee on the employee property of the response body
// If any required fields are missing, returns a 400 response
employeesRouter.post('', validateEmployee, (req, res, next) => {
  const newEmployee = req.body.employee;
  db.run(`INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)`,
  {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(201).send({employee: row});
    });
  });
});

// /api/employees/:employeeId

// GET
// Returns a 200 response containing the employee with the supplied employee ID on the employee property of the response body
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).send({employee: req.employee});
});

// PUT
// Updates the employee with the specified employee ID using the information from the employee property of the request body and saves it to the database. Returns a 200 response with the updated employee on the employee property of the response body
// If any required fields are missing, returns a 400 response
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
  const newEmployee = req.body.employee;
  db.run(
    `UPDATE Employee
  SET name = $name, position = $position, wage = $wage
  WHERE id = $employeeId`,
  {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
    $employeeId: req.params.employeeId
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).send({employee: row});
    });
  });
});

// DELETE
// Updates the employee with the specified employee ID to be unemployed (is_current_employee equal to 0). Returns a 200 response.
// If an employee with the supplied employee ID doesn't exist, returns a 404 response
employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run(
    `UPDATE Employee
    SET is_current_employee = 0
    WHERE id = $employeeId`,
    {
      $employeeId: req.params.employeeId
    },
    function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(200).send({employee: row});
      });
    });
});

module.exports = employeesRouter;
