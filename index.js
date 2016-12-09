import FileSaver from 'file-saver';
// Declare component elements
const $body = document.body;
const $canvas = document.querySelector('canvas');
const $avatar = document.createElement('img');
const $prev = document.querySelector('.prev');
const $download = document.querySelector('.download');
const $next = document.querySelector('.next');

// Initialize panning options
let dragStart = { x:0, y:0 };
let imgPos = { x:0, y:0 };

// Helper function for when downloading
const cloneCanvas = (oldCanvas) => {
  const newCanvas = document.createElement('canvas');
  const context = newCanvas.getContext('2d');
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  context.drawImage(oldCanvas, 0, 0);
  return newCanvas;
};

// Apply a filter to a canvas
const applyFilter = (canvas) => (url) =>
new Promise((resolve, reject) => {
  const image = document.createElement('img');
  image.src = url;
  image.onload = () => {
    canvas.getContext('2d')
    .drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(canvas);
  }
});

// Draw an avatar to a canvas
const drawAvatar = (url) => {
  imgPos = { x:0, y:0 };
  $avatar.src = url;
  $avatar.onload = () => {
    // Set the $canvas size to the $avatars shortest side
    $canvas.width = Math.min($avatar.width, $avatar.height);
    $canvas.height = Math.min($avatar.width, $avatar.height);
    // Draw the avatar $avatar to $canvas
    $canvas.getContext('2d')
    .drawImage($avatar, 0, 0, $avatar.width, $avatar.height);
  }
};

// Create file blob from dataUrl and initiate a download
const download = (dataUrl) => {
  const c = cloneCanvas($canvas);
  const f = document.querySelector('.active').src;
  applyFilter(c)(f).then(res => {
    const dataUrl = res.toDataURL('image/jpg');
    const data = atob(dataUrl.substring("data:image/png;base64,".length));
    const asArray = new Uint8Array(data.length);
    for (let i = 0, len = data.length; i < len; ++i) asArray[i] = data.charCodeAt(i);
    const f = new Blob([asArray.buffer], {type:'application/octet-stream'});
    FileSaver.saveAs(f, "filter.jpg");
  });
};

// Move $avatar around canvas according to drag event
const track = (e) => {
  const x = Math.max(Math.min(imgPos.x+(e.pageX-dragStart.x), 0), ($canvas.width - $avatar.width));
  const y = Math.max(Math.min(imgPos.y+(e.pageY-dragStart.y), 0), ($canvas.height - $avatar.height));
  // Draw the avatar on the $canvas
  $canvas.getContext('2d')
    .drawImage($avatar, x, y, $avatar.width, $avatar.height);
};

// Setup at the start of a drag event
const start = (e) => {
  dragStart = { x: e.pageX, y: e.pageY };
  $body.addEventListener('mousemove', track);
};

// Teardown ar the end of a drag event
const stop = (e) => {
  $body.removeEventListener('mousemove', track);
  imgPos = {
    x: Math.max(Math.min(imgPos.x+(e.pageX-dragStart.x), 0), ($canvas.width - $avatar.width)),
    y: Math.max(Math.min(imgPos.y+(e.pageY-dragStart.y), 0), ($canvas.height - $avatar.height)),
  };
};

// Extract image dataUrl from drop event
const processInput = (e) => {
  e.stopPropagation();
  e.preventDefault();
  // Setup file reader
  const reader = new FileReader();
  const file =  e.dataTransfer.files[0];
  const acceptedFiles = ['png', 'bmp', 'jpg', 'jpeg', 'gif'];
  // Ensure that the file type
  if (!acceptedFiles.includes(file.type.replace('image/', ''))) {
    alert('Incompatible file type!');
    return;
  }
  // Initiate reading of file
  reader.onload = file => drawAvatar(file.srcElement.result);
  reader.readAsDataURL(file);
};

const nextFilter = () => {
  const overlay = document.querySelector('overlay-');
  let index = parseInt(overlay.dataset.index, 10);
  if(index < overlay.children.length-1) {
    overlay.dataset.index = ++index;
    overlay.style.transform = `translateX(-${(index * 62)}vmin)`;
    // Add active class to focus filter
    [...overlay.children].forEach(x => x.classList.remove('active'));
    overlay.children[index].classList.add('active');
  }
}

const prevFilter = () => {
  const overlay = document.querySelector('overlay-');
  let index = parseInt(overlay.dataset.index, 10);
  if(index > 0) {
    overlay.dataset.index = --index;
    overlay.style.transform = `translateX(-${(index * 62)}vmin)`;
    // Add active class to focus filter
    [...overlay.children].forEach(x => x.classList.remove('active'));
    overlay.children[index].classList.add('active');
  }
}

// Create a drag-and-drop interface for images on entire body
$body.addEventListener('dragover', (e) => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
// When the user drops or inputs an image process the image
$body.addEventListener('drop', processInput);

// Pan image on drag from $canvas
$canvas.addEventListener('mousedown', start);
// Stop any tracking at end of drag
$body.addEventListener('mouseup', stop);
$body.addEventListener('mouseleave', stop);

// When the user uses the arrow keys to change filter
$body.addEventListener('keyup', (e) => {
  // Right arrow for next filter
  if(e.keyCode === 39) nextFilter();
  // Left arrow for previous filter
  if(e.keyCode === 37) prevFilter();
  // Spacebar from download
  if(e.keyCode === 32) download();
});

// Listen for interaction with controls
$next.addEventListener('click', nextFilter);
$download.addEventListener('click', download);
$prev.addEventListener('click', prevFilter);

// Apply default avatar
drawAvatar('avatar.jpg');
