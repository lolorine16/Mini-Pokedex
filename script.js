const btn = document.getElementById('btn-search');

btn.addEventListener('click', () => {
  const input = document.getElementById('search').value.trim().toLowerCase();
  
  // Verifie si c’est un nombre ou un nom
  const query = isNaN(input) ? input : Number(input); 

  fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
    .then(res => {
      if (!res.ok) throw new Error("Pokémon non trouvé !");
      return res.json(); // J#ai un doute sur l'indentation ici
    })
        .then(data => {
            document.getElementById('pokemon-id').innerText = `#${data.id.toString().padStart(4, '0')}`;
            document.getElementById('pokemon-name').innerText = data.name;
            document.getElementById('pokemon-img').src = data.sprites.other['home'].front_default;
            document.getElementById('pokemon-gif').src = data.sprites.other['showdown'].front_default;
            // Affichage des types
            const types = data.types.map(t => t.type.name);
            displayTypes(types);
            // Deuxième requête pour la description :
            return fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}`);
    })
    .then(res => res.json())
    .then(speciesData => {
      const flavor = speciesData.flavor_text_entries.find(e => e.language.name === "en");
      document.getElementById('pokemon-description').innerText = flavor ? flavor.flavor_text : "No description available.";
    })
    .catch(() => alert("Pokémon non trouvé !"));
});




function displayTypes(types) {
  const typesContainer = document.querySelector(".types");
  typesContainer.innerHTML = ""; // vider avant d'ajouter

  types.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = type.toUpperCase();
    btn.classList.add("type-btn", `type-${type}`);
    typesContainer.appendChild(btn);
  });
}
