let book
let rendition

// Toggle TOC on and off
function toggleTOC () {
  const button = document.getElementById('show-toc');
  button.toggleAttribute('toggled');

  if (button.getAttribute('toggled') === null) {
    document.getElementById('reader').style.gridTemplateColumns = '0 1fr';
    document.getElementById('sidebar').style.visibility = 'hidden';
  } else {
    document.getElementById('reader').style.gridTemplateColumns = 'max-content 1fr';
    document.getElementById('sidebar').style.visibility = 'visible';
  }

  // HACK: Update the rendition
  rendition.start();
}

async function openFile() {
  const file = await window.api.openFileDialog();
  const data = await window.api.readFile(file.filePaths[0]);

  open(data);
}

function open(data) {
  document.getElementById('viewer').textContent = '';
  document.getElementById('toc').textContent = '';

  book = ePub();
  book.open(data);

  book.ready.then(() => {
    document.getElementById('drop-area').style.display = 'none';
    document.getElementById('reader').style.display = 'grid';

    rendition = book.renderTo('viewer', {
      width: '100%',
      height: '100%',
      spread: 'always'
    });
  
    rendition.themes.register('default.css');
    rendition.themes.register('light', 'themes.css');
    rendition.themes.register('dark', 'themes.css');
    rendition.themes.register('solarized-light', 'themes.css');
    rendition.themes.register('solarized-dark', 'themes.css');
  
    setTheme('light');
  
    loadThemes();

    rendition.on('keyup', onKeyUp);
    rendition.on('relocated', onRelocated);
  
    rendition.display();
  })

  book.loaded.metadata.then((metadata) => {
    document.title = 'Scriptum - ' + metadata.title;
  });

  book.loaded.navigation.then((toc) => {
    if (toc.length <= 1) {
      document.getElementById('show-toc').disabled = true;
      return;
    }

    const tocDiv = document.getElementById('toc');

    toc.forEach((value) => {
      tocDiv.appendChild(addTocItem(value));
    })

    document.getElementById('show-toc').disabled = false
  });
}

// Load themes
function loadThemes() {
  const themesMenu = document.getElementById('themes-menu');

  for(const theme in rendition.themes._themes) {
    if(theme === 'default') continue;

    const button = document.createElement('button');
    button.className = 'theme';
    button.classList.add(theme);
    button.innerHTML = 'A';
    button.title = theme;
    button.onclick = () => { setTheme(theme) };
    themesMenu.appendChild(button);
  }
}

// Add TOC item
function addTocItem(toc) {
  // Node
  const node = document.createElement('div');
  node.className = 'node';

  // Item
  const item = document.createElement('div');
  item.className = 'item';
  item.setAttribute('ref', toc.href);
  item.onclick = () => {
    rendition.display(item.getAttribute('ref'));
  }
  node.appendChild(item);

  // Label
  const label = document.createElement('div');
  label.className = 'label';
  label.innerHTML = toc.label;
  item.appendChild(label);

  if(toc.subitems.length > 0) {
    // Arrow
    const arrow = document.createElement('div');
    arrow.classList.add('material-icons');
    arrow.classList.add('arrow');
    arrow.onclick = () => { console.log('arrow'); node.toggleAttribute('expanded'); }
    item.prepend(arrow);

    // Subitems
    const subitems = document.createElement('div');
    subitems.className = 'items';
    toc.subitems.forEach((subitem) => {
      subitems.appendChild(addTocItem(subitem));
    })
    node.appendChild(subitems);
  }

  return node;
}

// Next page
function next() {
  if(book.package.metadata.direction === 'rtl') {
    rendition.prev();
  } else rendition.next();
}

// Previous page
function prev() {
  if(book.package.metadata.direction === 'rtl') {
    rendition.next();
  } else rendition.prev();
}

// Set theme
function setTheme(id) {
  rendition.themes.select(id);
  document.documentElement.setAttribute('theme', id);
}

// Get chapter
function getChapter (href) {
  if (book.navigation.toc.length <= 1) return '';

  for (const item of book.navigation.toc) {
    if (item.href === href) return item.label;
    for (const subitem of item.subitems) {
      if (subitem.href === href) return subitem.label;
    }
  }

  return href;
}

// On rendition relocation
function onRelocated(location) {
  const next = book.package.metadata.direction === 'rtl' ? document.getElementById('prev') : document.getElementById('next')
  const prev = book.package.metadata.direction === 'rtl' ? document.getElementById('next') : document.getElementById('prev')

  if (location.atEnd) {
    next.disabled = true;
  } else {
    next.disabled = false;
  }

  if (location.atStart) {
    prev.disabled = true;
  } else {
    prev.disabled = false;
  }

  const headersDiv = document.getElementsByClassName('viewer-header')
  const footersDiv = document.getElementsByClassName('viewer-footer')

  if (location.atStart) {
    headersDiv[0].innerHTML = ''
    headersDiv[1].innerHTML = ''
    footersDiv[0].innerHTML = ''
    footersDiv[1].innerHTML = ''
  } else {
    headersDiv[0].innerHTML = book.packaging.metadata.title
    headersDiv[1].innerHTML = getChapter(location.start.href)
    footersDiv[0].innerHTML = location.start.displayed.page
    footersDiv[1].innerHTML = location.end.displayed.page
  }

  const viewer = document.getElementById('viewer-container');
  if (rendition._layout.divisor === 2) {
    viewer.classList.remove('single');
    document.getElementById('viewer-container').style.gridTemplateColumns = '1fr 1fr';
    headersDiv[0].style.visibility = 'visible';
    footersDiv[0].style.visibility = 'visible';
  } else {
    viewer.classList.add('single');
    document.getElementById('viewer-container').style.gridTemplateColumns = '0 1fr';
    headersDiv[0].style.visibility = 'hidden';
    footersDiv[0].style.visibility = 'hidden';
  }
}

// Key listener
function onKeyUp(ev) {
  if ((ev.keyCode || ev.which) === 37) {
    prev();
  }
  if ((ev.keyCode || ev.which) === 39) {
    next();
  }
}

// Show menu
function showMenu(menu) {
  hideMenus();
  document.getElementById('backdrop').style.visibility = 'visible';
  document.getElementById(menu).style.visibility = 'visible';
}

// Hide all menus
function hideMenus() {
  document.getElementById('backdrop').style.visibility = 'hidden';

  const menus = document.getElementsByClassName('menu');
  for(const menu of menus) {
    menu.style.visibility = 'hidden';
  }
}

// Window load
window.addEventListener('load', () => {
  const dropDiv = document.getElementById('drop-area');
  dropDiv.ondragover = () => { return false };
  dropDiv.ondrop = (ev) => {
    ev.preventDefault();
    if (window.FileReader) {
      const reader = new window.FileReader();
      reader.onload = (ev) => { open(ev.target.result) };
      reader.readAsArrayBuffer(ev.dataTransfer.files[0]);
    }
  };

  document.getElementById('show-toc').onclick = toggleTOC;
  document.getElementById('overflow-menu-button').onclick = () => { showMenu('overflow-menu') };
  document.getElementById('menu-open').onclick = () => { openFile(); hideMenus() };
  document.getElementById('menu-themes').onclick = () => { showMenu('themes-menu') };
  document.getElementById('themes-menu-back').onclick = () => { showMenu('overflow-menu') };

  document.getElementById('next').onclick = next;
  document.getElementById('prev').onclick = prev;

  document.addEventListener('keyup', onKeyUp, false);
})

// Window resize
window.addEventListener('resize', () => {
  const viewer = document.getElementById('viewer');
  viewer.classList.remove('single');
});

document.getElementById('menu-quit').onclick = () => { 
  window.close(); 
};