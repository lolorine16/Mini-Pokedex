const btn = document.getElementById('btn-search');

btn.addEventListener('click', () => {
    const name = document.getElementById('search').value.toLowerCase();
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('pokemon-name').innerText = data.name;
            document.getElementById('pokemon-img').src = data.sprites.front_default;
            document.getElementById('pokemon-type').innerText = data.types.map(t => t.type.name).join(', ');
        })
        .catch(() => alert("Pokemon non trouve !"));
});