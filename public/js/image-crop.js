// Checks if data is composed of repetitions of slice.
function isRepeated(slice, data) {
  // if the size of data can't fit an integer number of slices, we could
  // never match.
  if (data.length % slice.length !== 0) {
    return false;
  }

  for (var p = 0; p < data.length; p += slice.length) {
    for (var c = 0; c < slice.length; c++) {
      if (data[p+c] != slice[c]) {
        return false;
      }
    }
  }

  return true;
}

function getForegroundBounds(context, width, height) {
  // each pixel is a 4-element array: [r, g, b, a]
  var bg_color = context.getImageData(0, 0, 1, 1).data;

  // not necessary to initialie fields, it will happen anyway.
  var bounds = { top: 0, bottom: height, left: 0, right: width };
  
  // move in from each edge until. As long as we're seeing all pixels of the
  // same color assume that it's part of a "background". As soon as we see a
  // different color assume that's the beginning of a "foreground".
  for (var x = 0; x < width; x++) {
    var pixelCol = context.getImageData(x, 0, 1, height).data;
    if (!isRepeated(bg_color, pixelCol)) {
      bounds.left = x;
      break;
    }
  }
  for (var x = width - 1; x >= 0; x--) {
    var pixelCol = context.getImageData(x, 0, 1, height).data;
    if (!isRepeated(bg_color, pixelCol)) {
      bounds.right = x;
      break;
    }
  }
  for (var y = 0; y < height; y++) {
    var pixelRow = context.getImageData(0, y, width, 1).data;
    if (!isRepeated(bg_color, pixelRow)) {
      bounds.top = y;
      break;
    }
  }
  for (var y = height - 1; y >= 0; y--) {
    var pixelRow = context.getImageData(0, y, width, 1).data;
    if (!isRepeated(bg_color, pixelRow)) {
      bounds.bottom = y;
      break;
    }
  }

  return bounds;
}

function cropImageData(imageUrl, outputCanvas, paddingX, paddingY) {
  paddingX = paddingX || 0;
  paddingY = paddingY || 0;

  var img = new Image();
  img.src = imageUrl;
  img.onload = function() {
    // load the original
    outputCanvas.width = img.width;
    outputCanvas.height = img.height;
    var context = outputCanvas.getContext('2d');
    context.drawImage(img, 0, 0);

    var bounds = getForegroundBounds(context, img.width, img.height);

    // add padding to the cropped image.
    bounds.left = Math.max(bounds.left - paddingX, 0);
    bounds.right = Math.min(bounds.right + paddingX, img.width);
    bounds.top = Math.max(bounds.top - paddingY, 0);
    bounds.bottom = Math.min(bounds.bottom + paddingY, img.height);
    var width = bounds.right - bounds.left;
    var height = bounds.bottom - bounds.top;

    // resize canvas to cropped image's size
    outputCanvas.width = width;
    outputCanvas.height = height;

    // draw the cropped image
    var outputContext = outputCanvas.getContext('2d');
    outputContext.drawImage(
      img,
      bounds.left, bounds.top, width, height, // source rect
      0, 0, width, height); // destination rect
  };
}