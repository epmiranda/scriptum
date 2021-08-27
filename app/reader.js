class Reader {
  constructor() {
    this.book = ePub();
  }

  open(data) {
    this.book.open(data);
    this.book.ready.then(this.onReady);

    this.rendition = this.book.renderTo('viewer', {
      width: '100%',
      height: '100%',
      spread: 'always'
    });
  
    this.rendition.themes.default({
      body: {
        'font-family': 'serif',
        'font-size': '16px'
      },
      h1: {
        margin: '1em 0 1em 0',
        'text-align': 'center'
      },
      h2: {
        margin: '25% 0 25% 0',
        'text-align': 'center'
      },
      h3: {
        margin: '0 0 1em 0',
        'text-align': 'center'
      },
      p: {
        margin: '1em 0',
        'text-align': 'justify'
      }
    });
  
    this.rendition.themes.register('dark', 'themes.css');
    this.rendition.themes.register('light', 'themes.css');
    this.rendition.themes.register('solarized-light', 'themes.css');

    this.setTheme('solarized-light');
  
    this.rendition.display();
  }

  close() {
    this.book.destroy();
  }

  next() {
    if(this.book.package.metadata.direction === 'rtl') {
      this.rendition.prev();
    } else this.rendition.next();
  }

  prev() {
    if(this.book.package.metadata.direction === 'rtl') {
      this.rendition.next();
    } else this.rendition.prev();
  }

  setTheme(id) {
    this.rendition.themes.select(id);
    document.documentElement.setAttribute('theme', id);
  }

  onReady() {
    document.getElementById('drop-area').style.display = 'none';
    document.getElementById('reader').style.display = 'grid';

    var _this = this;
    console.log(this)
    document.getElementById('next').onclick = _this.next;
  
    // Previous button
    document.getElementById('prev').addEventListener('click', (e) => {
      this.prev();
      e.preventDefault()
    }, false)
  
    // Keys
    this.rendition.on('keyup', this.onKeyUp)
    document.addEventListener('keyup', this.onKeyUp, false)
  
    // Relocation
    this.rendition.on('relocated', this.onRelocated)
  }

  onRelocated(location) {
    const next = this.book.package.metadata.direction === 'rtl' ? document.getElementById('prev') : document.getElementById('next');
    const prev = this.book.package.metadata.direction === 'rtl' ? document.getElementById('next') : document.getElementById('prev');

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

    const headersDiv = document.getElementsByClassName('header');
    const footersDiv = document.getElementsByClassName('footer');
    if (location.atStart) {
      headersDiv[0].innerHTML = '';
      headersDiv[1].innerHTML = '';
      footersDiv[0].innerHTML = '';
      footersDiv[1].innerHTML = '';
    } else {
      headersDiv[0].innerHTML = this.book.packaging.metadata.title;
      headersDiv[1].innerHTML = getChapter(location.start.href);
      footersDiv[0].innerHTML = location.start.displayed.page;
      footersDiv[1].innerHTML = location.end.displayed.page;
    }

    const pageDiv = document.getElementById('page');
    pageDiv.innerHTML = location.end.displayed.page + ' / ' + location.end.displayed.total;

    const viewerDiv = document.getElementById('viewer');
    if (this.rendition._layout.divisor === 2) {
      viewerDiv.classList.remove('single');
    } else {
      viewerDiv.classList.add('single');
    }
  }

  onKeyUp(ev) {
    // Left Key
    if ((ev.keyCode || ev.which) === 37) {
      this.prev()
    }

    // Right Key
    if ((ev.keyCode || ev.which) === 39) {
      this.next
    }
  }
}
