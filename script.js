const btn = document.getElementById('btn-search');

btn.addEventListener('click', () => {
    const name = document.getElementById('search').value.toLowerCase();
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('pokemon-name').innerText = data.name;
            document.getElementById('pokemon-img').src = data.sprites.other['home'].front_default;
            document.getElementById('pokemon-type').innerText = data.types.map(t => t.type.name).join(', ');
            document.getElementById('pokemon-gif').src = data.sprites.other['showdown'].front_default;
        
            // Deuxième requête pour la description :
            return fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
    })
    .then(res => res.json())
    .then(speciesData => {
      const flavor = speciesData.flavor_text_entries.find(e => e.language.name === "en");
      document.getElementById('pokemon-description').innerText = flavor ? flavor.flavor_text : "No description available.";
    })
    .catch(() => alert("Pokémon non trouvé !"));
});