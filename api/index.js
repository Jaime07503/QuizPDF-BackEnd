const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use();

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
