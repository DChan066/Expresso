const express = require('express');
const menusRouter = express.Router();
const menuItemsRouter = require('./menuitem.js');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// When a menu id is given, check whether a menu with that id exists in the database
// If menu exists, set req.menu to the query result and call next()
// Else, return a status code of 404 Not Found
menusRouter.param('menuId', (req, res, next, id) => {
  db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, row) => {
    if (row) {
      req.menu = row;
      next();
    }
    else {
      return res.sendStatus(404);
    }
  });
});

// Menu item related endpoints are handled in menuitem.js
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

// /api/menus

// GET
// Returns a 200 response containing all saved menus on the menus property of the response body
menusRouter.get('', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send({menus: rows});
    }
  });
});

// Checks that requests to create or modify a menu have all required fields filled with valid inputs
const validateMenu = (req, res, next) => {
  const newMenu = req.body.menu;
  if (!newMenu.title) {
    return res.sendStatus(400);
  }
  next();
}

// POST
// Creates a new menu with the information from the menu property of the request body and saves it to the database. Returns a 201 response with the newly-created menu on the menu property of the response body
// If any required fields are missing, returns a 400 response
menusRouter.post('', validateMenu, (req, res, next) => {
  db.run(`INSERT INTO Menu (title) VALUES ($title)`,
  {
    $title: req.body.menu.title
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(201).send({menu: row});
    });
  });
});

// /api/menus/:menuId

// GET
// Returns a 200 response containing the menu with the supplied menu ID on the menu property of the response body
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).send({menu: req.menu});
});

// PUT
// Updates the menu with the specified menu ID using the information from the menu property of the request body and saves it to the database. Returns a 200 response with the updated menu on the menu property of the response body
// If any required fields are missing, returns a 400 response
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  db.run(
    `UPDATE Menu SET title = $title WHERE id = $menuId`,
  {
    $title: req.body.menu.title,
    $menuId: req.params.menuId
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).send({menu: row});
    });
  });
});

// DELETE
// Deletes the menu with the supplied menu ID from the database if that menu has no related menu items. Returns a 204 response.
// If the menu with the supplied menu ID has related menu items, returns a 400 response.
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
menusRouter.delete('/:menuId', (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (err, row) => {
    if (row) {
      return res.sendStatus(400);
    }
    db.run(
      `DELETE FROM Menu WHERE id = ${req.params.menuId}`,
      function(err) {
        if (err) {
          return res.sendStatus(500);
        }
        res.sendStatus(204);
    });
  });
});

module.exports = menusRouter;
