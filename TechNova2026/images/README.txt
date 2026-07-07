This folder is intentionally empty.

The gallery and speaker photos in this site are drawn as inline SVG
placeholders so the project runs with zero binary assets and stays easy
to containerize. Drop real photos here (e.g. speaker-1.jpg, gallery-01.jpg)
and swap the corresponding <svg>...</svg> blocks in gallery.html /
speakers.html / index.html for <img src="images/your-file.jpg" alt="...">.

The Dockerfile already copies this entire folder into the image
(COPY images/ /usr/share/nginx/html/images/), so nothing else needs to
change once you add files here.
