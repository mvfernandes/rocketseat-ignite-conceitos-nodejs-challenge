const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);
  if (user) {
    request.user = user;
    return next();
  }

  return response.status(404).json({ error: "User not found" });
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;
  if (users.some((user) => user.username === username)) {
    return response.status(400).send({ error: "User already exists" });
  }
  const id = uuidv4();
  const user = {
    id,
    name,
    username,
    todos: [],
  };
  users.push(user);

  return response.status(201).send(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  return response.json(request.user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  const { title, deadline } = request.body;
  const todo = {
    id: uuidv4(),
    done: false,
    title,
    deadline: new Date(deadline),
    created_at: new Date(),
  };
  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  const { title, deadline } = request.body;
  const { id } = request.params;
  const todo = user.todos.find((todo) => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: "Todo not" });
  }
  const newTodo = {
    ...todo,
    title,
    deadline: new Date(deadline),
  };
  user.todos = user.todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, ...newTodo };
    }
    return todo;
  });

  return response.status(201).json(newTodo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  const { id } = request.params;
  const todo = user.todos.find((todo) => todo.id === id);
  if (!todo) return response.status(404).json({ error: "Todo not found" });
  const newTodo = {
    ...todo,
    done: true,
  };
  user.todos = user.todos.map((todo) => {
    if (todo.id === id) {
      return newTodo;
    }
    return todo;
  });

  return response.send(newTodo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  const { id } = request.params;
  const todo = user.todos.find((todo) => todo.id === id);
  if (!todo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  user.todos = user.todos.filter((todo) => todo.id !== id);

  return response.status(204).json([]);
});

module.exports = app;
