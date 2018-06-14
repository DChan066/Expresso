const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// When a menu item id is given, check whether a menu item with that id exists in the database
// If menu item exists, set req.menuItem to the query result and call next()
// Else, return a status code of 404 Not Found
menuItemsRouter.param('menuItemId', (req, res, next, id) => {
  db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (err, row) => {
    if (row) {
      req.menuItem = row;
      next();
    }
    else {
      return res.sendStatus(404);
    }
  });
});

// /api/menus/:menuId/menu-items

// GET
// Returns a 200 response containing all saved menu items related to the menu with the supplied menu ID on the menuItems property of the response body
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
menuItemsRouter.get('', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).send({menuItems: rows});
    }
  });
});

// Checks that requests to create or modify a menu item have all required fields filled with valid inputs
const validateMenuItem = (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  if (!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price ) {
    return res.sendStatus(400);
  }
  next();
}

// POST
// Creates a new menu item, related to the menu with the supplied menu ID, with the information from the menuItem property of the request body and saves it to the database. Returns a 201 response with the newly-created menu item on the menuItem property of the response body
// If any required fields are missing, returns a 400 response
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
menuItemsRouter.post('', validateMenuItem, (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  db.run(`INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)`,
  {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menu_id: req.params.menuId
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(201).send({menuItem: row});
    });
  });
});

// /api/menus/:menuId/menu-items/:menuItemId

// PUT
// Updates the menu item with the specified menu item ID using the information from the menuItem property of the request body and saves it to the database. Returns a 200 response with the updated menu item on the menuItem property of the response body
// If any required fields are missing, returns a 400 response
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
// If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
menuItemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  db.run(
    `UPDATE MenuItem
  SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id
  WHERE id = $menuItemId`,
  {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menu_id: req.params.menuId,
    $menuItemId: req.params.menuItemId
  }, function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (err, row) => {
      if (!row) {
        return res.sendStatus(500);
      }
      res.status(200).send({menuItem: row});
    });
  });
});

// DELETE
// Deletes the menu item with the supplied menu item ID from the database. Returns a 204 response.
// If a menu with the supplied menu ID doesn't exist, returns a 404 response
// If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  db.run(
    `DELETE FROM MenuItem WHERE id = ${req.params.menuItemId}`,
    function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      res.sendStatus(204);
    });
});

module.exports = menuItemsRouter;
