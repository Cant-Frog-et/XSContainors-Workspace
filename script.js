const STORAGE_KEY = 'xscontainers_data';
const THEME_KEY = 'xscontainers_theme';

const createButton = document.getElementById('create-container');
const uploadButton = document.getElementById('upload-file');
const fileInput = document.getElementById('file-input');
const containerList = document.getElementById('container-list');
const fileList = document.getElementById('file-list');
const themeToggle = document.getElementById('theme-toggle');

function normalizeFileRecord(entry) {
  if (typeof entry === 'string') {
    return {
      name: entry,
      size: 0,
      type: 'application/octet-stream',
      dataUrl: '',
      uploadedAt: ''
    };
  }

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  return {
    name: typeof entry.name === 'string' ? entry.name : 'Unnamed file',
    size: typeof entry.size === 'number' ? entry.size : 0,
    type: typeof entry.type === 'string' ? entry.type : 'application/octet-stream',
    dataUrl: typeof entry.dataUrl === 'string' ? entry.dataUrl : '',
    uploadedAt: typeof entry.uploadedAt === 'string' ? entry.uploadedAt : ''
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { containers: [], files: [] };
  }

  try {
    const parsed = JSON.parse(saved);
    const containers = Array.isArray(parsed.containers) ? parsed.containers : [];
    const files = Array.isArray(parsed.files)
      ? parsed.files.map(normalizeFileRecord).filter(Boolean)
      : [];

    return {
      containers: containers.filter((name) => typeof name === 'string'),
      files
    };
  } catch {
    return { containers: [], files: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function render(data) {
  containerList.innerHTML = '';
  fileList.innerHTML = '';

  if (data.containers.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No containers yet.';
    containerList.appendChild(empty);
  } else {
    data.containers.forEach((name) => {
      const item = document.createElement('li');
      item.textContent = name;
      containerList.appendChild(item);
    });
  }

  if (data.files.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No files uploaded yet.';
    fileList.appendChild(empty);
  } else {
    data.files.forEach((fileRecord) => {
      const item = document.createElement('li');
      item.textContent = `${fileRecord.name} (${formatFileSize(fileRecord.size)})`;
      fileList.appendChild(item);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent =
    theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

const appData = loadData();
render(appData);

const storedTheme = localStorage.getItem(THEME_KEY) || 'light';
applyTheme(storedTheme);

createButton.addEventListener('click', () => {
  const id = appData.containers.length + 1;
  appData.containers.push(`Container ${id}`);
  saveData(appData);
  render(appData);
});

uploadButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readFileAsDataURL(file);
    appData.files.push({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      dataUrl,
      uploadedAt: new Date().toISOString()
    });
    saveData(appData);
    render(appData);
  } catch {
    alert('File upload failed. Please try a smaller file.');
  }

  fileInput.value = '';
});

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});
