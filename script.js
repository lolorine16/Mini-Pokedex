const btn = document.getElementById("btn-search");
const inputEl = document.getElementById("search");
const pokemonImage = document.getElementById("pokemon-img");
if (pokemonImage) pokemonImage.style.display = "none";
let searchActive = false;
let loading = false;
const pokemonCardScreen = document.getElementById("pokemon-cardScreen");
const pokemonListScreen = document.getElementById("pokemon-listScreen");
// rename with correct spelling for clarity
const listControls = document.getElementById("list-controls");
// Fonction de recherche utilisée pour le clic et la touche Entrée
async function handleSearch(event, id = "") {
  // Si l'événement est un keydown, ne déclencher que sur Enter
  if (event && event.type === "keydown" && event.key !== "Enter") return;

  // Déterminer la requête (id fourni par code ou valeur de l'input)
  let raw;
  if (id !== "" && id != null) {
    raw = String(id);
  } else {
    if (!inputEl) return;
    raw = inputEl.value.trim().toLowerCase();
  }

  if (!raw) {
    alert("Veuillez entrer un nom ou un numéro de Pokémon.");
    return;
  }

  const query = isNaN(raw) ? raw : Number(raw);

  // UI: mode chargement
  loading = true;
  if (btn) btn.disabled = true;
  if (inputEl) inputEl.disabled = true;
  if (listControls) listControls.setAttribute("aria-hidden", "true");
  if (pokemonListScreen) pokemonListScreen.style.display = "none";

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!res.ok) {
      // restore UI
      if (pokemonCardScreen) pokemonCardScreen.style.display = "none";
      if (pokemonListScreen) pokemonListScreen.style.display = "";
      if (listControls) listControls.style.display = "";
      throw new Error("Pokémon non trouvé !");
    }
    const data = await res.json();

    if (pokemonCardScreen) pokemonCardScreen.style.display = "";
    if (pokemonListScreen) pokemonListScreen.style.display = "none";
    if (listControls) listControls.style.display = "none";

    // Mise à jour des informations de base
    const idEl = document.getElementById("pokemon-id");
    const nameEl = document.getElementById("pokemon-name");
    const imgEl = document.getElementById("pokemon-img");
    const gifEl = document.getElementById("pokemon-gif");
    const descEl = document.getElementById("pokemon-description");
    const jpNameEl = document.getElementById("pokemon-Jpname");
    if (idEl) idEl.innerText = `#${String(data.id).padStart(4, "0")}`;
    if (nameEl) nameEl.innerText = data.name || "";

    // Fallbacks pour les images (certaines clés peuvent être undefined)
    const imgHome = data.sprites?.other?.home?.front_default;
    const imgOfficial =
      data.sprites?.other?.["official-artwork"]?.front_default;
    const imgDefault = data.sprites?.front_default || "";
    const chosenImg = imgHome || imgOfficial || imgDefault;
    if (imgEl) {
      if (chosenImg) {
        imgEl.src = chosenImg;
        imgEl.style.display = "";
      } else {
        imgEl.style.display = "none";
      }
    }

    // Pour une animation/gif on tente plusieurs emplacements connus, sinon fallback
    const gif =
      data.sprites?.versions?.["generation-v"]?.["black-white"]?.animated
        ?.front_default ||
      data.sprites?.other?.home?.front_shiny ||
      chosenImg ||
      "";
    if (gifEl) gifEl.src = gif;

    // Affichage des types
    const types = (data.types || []).map((t) => t.type.name);
    displayTypes(types);
    // Affichage des statistiques
    const stats = (data.stats || []).map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    }));
    displayStats(stats);

    // Deuxième requête pour la description
    const speciesRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${data.id}`
    );
    let Jpname;
    if (speciesRes.ok) {
      const speciesData = await speciesRes.json();
      const flavor = (speciesData.flavor_text_entries || []).find(
        (e) => e.language?.name === "en"
      );
      jpname=speciesData.names.find((e) => e.language?.name === "ja-Hrkt");
      if (jpNameEl) jpNameEl.innerText = jpname ? jpname.name : "";
      if (descEl)
        descEl.innerText = flavor
          ? flavor.flavor_text.replace(/\n|\f/g, " ")
          : "No description available.";
    } else {
      if (descEl) descEl.innerText = "No description available.";
    }
  } catch (err) {
    // message utilisateur
    // console.error(err);
    alert("Pokémon non trouvé !");
  } finally {
    loading = false;
    if (btn) btn.disabled = false;
    if (inputEl) inputEl.disabled = false;
    if (listControls) listControls.setAttribute("aria-hidden", "false");
  }
}

// Liaison des événements : clic sur le bouton et touche Entrée dans l'input
if (btn) {
  btn.addEventListener("click", handleSearch);
  searchActive = true;
}
if (inputEl) {
  inputEl.addEventListener("keydown", handleSearch);
  searchActive = true;
  inputEl.addEventListener("change", () => {
    if (
      inputEl.value === "" ||
      inputEl.value === null ||
      inputEl.value === "all"
    ) {
      if (pokemonCardScreen) pokemonCardScreen.style.display = "none";
      if (pokemonListScreen) pokemonListScreen.style.display = "";
      if (listControls) listControls.style.display = "";
      searchActive = false;
    }
  });
}
const pokemonList = document.getElementById("pokemon-list");
const listLoader = document.getElementById("list-loader");
const typeFilter = document.getElementById("type-filter");
const listSearch = document.getElementById("list-search");

// small debounce to avoid too many filter updates
function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
async function fetchList() {
  const listUrl = "https://pokeapi.co/api/v2/pokemon?limit=1025";
  // show loader
  if (listLoader) listLoader.setAttribute("aria-hidden", "false");
  const responseList = await fetch(listUrl);
  const listData = await responseList.json();
  // Construire un tableau de promesses qui retournent les données JSON
  const promises = listData.results.map(async (pokemon) => {
    const response = await fetch(pokemon.url);
    const data = await response.json();
    return data; // <-- important : retourner les données pour Promise.allSettled
  });
  const settled = await Promise.allSettled(promises);

  // Pour chaque résultat réussi, crée une carte et l'ajoute au DOM
  const typesSet = new Set();
  settled.forEach((res, idx) => {
    if (res.status === "fulfilled") {
      const data = res.value;
      const img =
        data.sprites?.other?.home?.front_default ||
        data.sprites?.front_default ||
        "";

      const card = document.createElement("div");
      card.className = "pokemon-card";
      card.innerHTML = `
        <div class="card1">
          <img src="${img}" alt="${data.name}" class="pokemon-img1">
          <p class="pokemon-id1">#${data.id.toString().padStart(4, "0")}</p>
          <h3 class="pokemon-name1">${data.name}</h3>
        
        </div>
      `;

      // store data on element for later use
      card.dataset.pokemon = JSON.stringify({
        id: data.id,
        name: data.name,
        img: img,
        gif: data.sprites?.versions?.["generation-v"]?.["black-white"]?.animated
          ?.front_default,
        types: data.types.map((t) => t.type.name),
        stats: data.stats.map((s) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
      });
      if (pokemonList) pokemonList.appendChild(card);
      // collect types for the filter (independent from DOM presence)
      data.types.forEach((t) => typesSet.add(t.type.name));
    }
  });

  // populate type filter
  if (typeFilter) {
    Array.from(typesSet)
      .sort()
      .forEach((type) => {
        const opt = document.createElement("option");
        opt.value = type;
        opt.textContent = type.toUpperCase();
        opt.className = "pokemon-id1";
        typeFilter.appendChild(opt);
      });
  }

  // hide loader
  if (listLoader) listLoader.setAttribute("aria-hidden", "true");
} // <-- fermeture ajoutée de la fonction fetchList

fetchList();

// When a card is clicked, update the main pokemon display
if (pokemonList) {
  pokemonList.addEventListener("click", (e) => {
    const card = e.target.closest(".pokemon-card");
    if (!card) return;
    console.log(card);
    const raw = card.dataset.pokemon;
    if (!raw) return;
    const info = JSON.parse(raw);
    handleSearch({ type: "click" }, info.id);
  });
}

// Filter the visible cards by type and name
function applyListFilters() {
  const type = typeFilter ? typeFilter.value : "all";
  const name = listSearch ? listSearch.value.trim().toLowerCase() : "";
  const cards = pokemonList
    ? Array.from(pokemonList.querySelectorAll(".pokemon-card"))
    : [];
  cards.forEach((card) => {
    const info = JSON.parse(card.dataset.pokemon || "{}");
    let matchesType = true;
    if (type && type !== "all") {
      matchesType = info.types && info.types.includes(type);
    }
    let matchesName = true;
    if (name) {
      matchesName = info.name && info.name.toLowerCase().includes(name);
    }
    card.style.display = matchesType && matchesName ? "" : "none";
  });
}

if (typeFilter) typeFilter.addEventListener("change", applyListFilters);
if (listSearch)
  listSearch.addEventListener("input", debounce(applyListFilters, 150));

function displayTypes(types) {
  const typesContainer = document.querySelector(".types");
  if (!typesContainer) return;
  typesContainer.innerHTML = ""; // vider avant d'ajouter

  types.forEach((type) => {
    const btn = document.createElement("button");
    btn.textContent = type.toUpperCase();
    btn.classList.add("type-btn", `type-${type}`);
    typesContainer.appendChild(btn);
  });
}

// Affiche les statistiques dans l'élément #pokemon-stat
function displayStats(stats) {
  const statsEl = document.getElementById("pokemon-stat");
  if (!statsEl) return;
  // Nettoyer
  statsEl.innerHTML = "";

  stats.forEach((s) => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = `${s.name.toUpperCase()} `;

    const value = document.createElement("div");
    value.className = "stat-value";
    value.textContent = String(s.value);

    row.appendChild(label);
    row.appendChild(value);

    statsEl.appendChild(row);
  });
}
