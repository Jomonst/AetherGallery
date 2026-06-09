// Initial Gallery Data
let galleryData = [
  {
    id: 1,
    title: 'Nature Cascade',
    category: 'Nature',
    author: 'Elena Vance',
    src: 'images/nature_cascade.png'
  },
  {
    id: 2,
    title: 'Cyberpunk Street',
    category: 'Cyberpunk',
    author: 'Jaxon Thorne',
    src: 'images/cyberpunk_street.png'
  },
  {
    id: 3,
    title: 'Cosmic Nebula',
    category: 'Space',
    author: 'Dr. Astraea Nova',
    src: 'images/cosmic_nebula.png'
  },
  {
    id: 4,
    title: 'Minimal Architecture',
    category: 'Architecture',
    author: 'Sora Tanaka',
    src: 'images/minimal_arch.png'
  }
];

// State variables
let activeFilter = 'all';
let searchQueryParams = '';
let currentLightboxIndex = 0;
let filteredImages = [...galleryData];
let uploadedImgBase64 = null;

// DOM Elements
const galleryGrid = document.getElementById('galleryGrid');
const searchInput = document.getElementById('searchInput');
const filtersWrapper = document.getElementById('filtersWrapper');
const themeToggle = document.getElementById('themeToggle');
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxMeta = document.getElementById('lightboxMeta');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

// Upload Elements
const uploadModal = document.getElementById('uploadModal');
const openUploadBtn = document.getElementById('openUploadBtn');
const closeUploadBtn = document.getElementById('closeUploadBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const uploadForm = document.getElementById('uploadForm');
const dragArea = document.getElementById('dragArea');
const fileInput = document.getElementById('fileInput');

// Initialize Website
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  setupEventListeners();
  initTheme();
});

// Render the grid dynamically based on filtering/search
function renderGallery() {
  galleryGrid.innerHTML = '';
  
  // Apply Search and Filters
  filteredImages = galleryData.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.category.toLowerCase() === activeFilter.toLowerCase();
    const query = searchQueryParams.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(query) ||
                          item.category.toLowerCase().includes(query) ||
                          item.author.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  if (filteredImages.length === 0) {
    galleryGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"/><path d="m21 21-4.3-4.3"/><path d="M8 12h8"/></svg>
        <h3>No masterpieces matched your query.</h3>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try adjusting your filters or search terms.</p>
      </div>
    `;
    return;
  }

  filteredImages.forEach((item, index) => {
    const card = document.createElement('article');
    card.classList.add('gallery-item');
    card.setAttribute('data-id', item.id);
    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${item.src}" alt="${item.title}" loading="lazy">
      </div>
      <div class="item-info">
        <h3 class="item-title">${item.title}</h3>
        <div class="item-meta">
          <span class="item-category">${item.category}</span>
          <span class="item-author">by ${item.author}</span>
        </div>
      </div>
    `;
    
    // Add Click listener to open lightbox
    card.addEventListener('click', () => {
      openLightbox(index);
    });

    galleryGrid.appendChild(card);
  });
}

// Set up all event handling logic
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    searchQueryParams = e.target.value;
    renderGallery();
  });

  // Category Filters
  filtersWrapper.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.getAttribute('data-category');
      renderGallery();
    }
  });

  // Lightbox Close
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Lightbox Navigation
  lightboxPrev.addEventListener('click', showPrevImage);
  lightboxNext.addEventListener('click', showNextImage);

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });

  // Theme Toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Upload Dialog controls
  openUploadBtn.addEventListener('click', () => {
    uploadModal.classList.add('active');
  });

  const closeUpload = () => {
    uploadModal.classList.remove('active');
    uploadForm.reset();
    dragArea.classList.remove('active');
    dragArea.querySelector('p').textContent = 'Drag & Drop Image or Click to Browse';
    uploadedImgBase64 = null;
  };

  closeUploadBtn.addEventListener('click', closeUpload);
  cancelUploadBtn.addEventListener('click', closeUpload);
  uploadModal.addEventListener('click', (e) => {
    if (e.target === uploadModal) closeUpload();
  });

  // File drag & drop setup
  dragArea.addEventListener('click', () => fileInput.click());
  
  dragArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragArea.classList.add('active');
  });

  dragArea.addEventListener('dragleave', () => {
    dragArea.classList.remove('active');
  });

  dragArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragArea.classList.remove('active');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageSelect(e.target.files[0]);
    }
  });

  // Upload Form Submit
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!uploadedImgBase64) {
      alert('Please upload or select an image.');
      return;
    }

    const title = document.getElementById('imgTitle').value.trim();
    const author = document.getElementById('imgAuthor').value.trim();
    const category = document.getElementById('imgCategory').value;

    const newItem = {
      id: Date.now(),
      title,
      category,
      author,
      src: uploadedImgBase64
    };

    galleryData.unshift(newItem); // Add new item to front of list
    renderGallery();
    closeUpload();
  });
}

// Handle image upload compression/conversion
function handleImageSelect(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload only images (JPEG/PNG/SVG).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImgBase64 = e.target.result;
    dragArea.querySelector('p').textContent = `Loaded: ${file.name}`;
    dragArea.classList.add('active');
  };
  reader.readAsDataURL(file);
}

// Lightbox logic
function openLightbox(index) {
  currentLightboxIndex = index;
  updateLightboxContent();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // Stop scrolling background
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function updateLightboxContent() {
  const item = filteredImages[currentLightboxIndex];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.title;
  lightboxTitle.textContent = item.title;
  lightboxMeta.textContent = `by ${item.author} • ${item.category}`;
}

function showPrevImage() {
  currentLightboxIndex = (currentLightboxIndex - 1 + filteredImages.length) % filteredImages.length;
  updateLightboxContent();
}

function showNextImage() {
  currentLightboxIndex = (currentLightboxIndex + 1) % filteredImages.length;
  updateLightboxContent();
}

// Theme handling logic
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
  if (theme === 'dark') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
}
