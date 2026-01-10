// Project Preview Button Functionality (Fixed)
document.querySelectorAll('.project-card button').forEach(button => {
  button.addEventListener('click', function () {
    const preview = this.nextElementSibling;
    const type = this.getAttribute('data-type');
    const url = this.getAttribute('data-url');

    // Toggle logic: If preview already has content, clear it
    if (preview.innerHTML.trim() !== '') {
      preview.innerHTML = '';
      return; // exit early
    }

    // Otherwise, show the content
    let embed = '';
    if (type === 'youtube') {
      embed = `<iframe src="${url}" allowfullscreen></iframe>`;
    } else if (type === 'image') {
      embed = `<img src="${url}" alt="Project Preview" style="max-width:100%; border-radius:10px;">`;
    } else if (type === 'doc') {
      embed = `<iframe src="${url}" allowfullscreen></iframe>`;
    }

    preview.innerHTML = embed;
  });
});
