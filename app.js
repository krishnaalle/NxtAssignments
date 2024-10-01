const formatIT = (each) => ({
  id: each.id,
  todo: `"${each.todo}"`,
  priority: `"${each.priority}"`,
  status: `"${each.status}"`,
});
const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const hasPriorityAndStatusProperties = (requestQuery) => {
  console.log(requestQuery, "requestQuery");
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// GET data from todos
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const { status, priority, search_q = "" } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
            AND status = "${status}"
            AND priority = "${priority}";`;
      break;

    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
            AND priority = "${priority}";`;
      break;

    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
            AND status = "${status}";`;
      break;
    default:
      getTodoQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
  }
  console.log(getTodoQuery, "getTodoQuery");
  const data = await db.all(getTodoQuery);
  console.log(data.map((each) => formatIT(each)));
  response.send(data);
});

// GET todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = ` SELECT * FROM todo
    WHERE id = ${todoId};`;
  data = await db.get(getTodoQuery);
  console.log(data);
  response.send(data);
});

// UPDATE the todo
app.post("/todos/", async (request, response) => {
  const { todo, priority, status } = request.body;
  const postTodoQuery = `INSERT INTO todo (todo, priority, status)
    VALUES ('${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// DELETE Todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = 
    `DELETE FROM Todo 
    WHERE id = ${todoId}`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

//UPDATE Todo
app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const property = request.body;
    const updates = Object.keys(property).map(key => `${key} = ?`).join(", ");

    const updateTodoQuery = 
        `UPDATE Todo
        SET ${updates}
        WHERE id = ${todoId}`;

    // Collect the values for parameterized query
    let values = [...Object.values(property)];
    console.log('', updates,values)
    await db.run(updateTodoQuery, values);
    values = updates.split(' ')[0]; // Extracts 'priority'
    response.send(`${values.charAt(0).toUpperCase() + values.slice(1)} Updated`);
});


module.exports = app;
