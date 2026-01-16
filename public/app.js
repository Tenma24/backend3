const listEl = document.getElementById("list");
const msgEl = document.getElementById("msg");

document.getElementById("loadBtn").addEventListener("click", loadCars);
document.getElementById("addBtn").addEventListener("click", addCar);

async function loadCars() {
  msgEl.textContent = "";
  listEl.innerHTML = "Loading...";

  try {
    const res = await fetch("/api/cars");
    const data = await res.json();

    if (!res.ok) {
      listEl.innerHTML = "";
      msgEl.textContent = data?.error || "Failed to load";
      return;
    }

    listEl.innerHTML = "";
    if (data.count === 0) {
      listEl.innerHTML = "<p>No cars yet.</p>";
      return;
    }

    for (const c of data.cars) {
      const div = document.createElement("div");
      div.className = "card";

      const title = `${c.brand} ${c.model} (${c.year})`;
      const price = typeof c.price === "number" ? c.price : "-";
      const mileage = c.mileage ?? "-";

      div.innerHTML = `
        <b>${escapeHtml(title)}</b> — ${price} KZT<br/>
        <span class="small">Mileage: ${mileage}</span><br/>
        <span class="small">Color: ${escapeHtml(c.color || "-")}, Transmission: ${escapeHtml(c.transmission || "-")}, Fuel: ${escapeHtml(c.fuel || "-")}</span><br/>
        <span class="small">id: ${c._id}</span><br/>
        <span class="small">createdAt: ${new Date(c.createdAt).toLocaleString()}</span><br/>
        <span class="small">updatedAt: ${new Date(c.updatedAt).toLocaleString()}</span><br/>
        <div class="small">${escapeHtml(c.description || "")}</div>
      `;
      listEl.appendChild(div);
    }
  } catch (e) {
    listEl.innerHTML = "";
    msgEl.textContent = "Network error";
  }
}

async function addCar() {
  msgEl.textContent = "";

  const brand = document.getElementById("brand").value;
  const model = document.getElementById("model").value;

  const year = Number(document.getElementById("year").value);
  const price = Number(document.getElementById("price").value);

  const mileageRaw = document.getElementById("mileage").value;
  const mileage = mileageRaw.trim() === "" ? null : Number(mileageRaw);

  const color = document.getElementById("color").value;
  const transmission = document.getElementById("transmission").value;
  const fuel = document.getElementById("fuel").value;
  const description = document.getElementById("description").value;

  const body = {
    brand,
    model,
    year,
    price,
    // optional
    mileage: mileage === null || Number.isNaN(mileage) ? null : mileage,
    color,
    transmission,
    fuel,
    description
  };

  try {
    const res = await fetch("/api/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data?.details ? data.details.join(", ") : (data?.error || "Error");
      return;
    }

    clearForm();
    await loadCars();
  } catch (e) {
    msgEl.textContent = "Network error";
  }
}

function clearForm() {
  for (const id of ["brand","model","year","price","mileage","color","transmission","fuel","description"]) {
    document.getElementById(id).value = "";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
