import { separableFilter, medianFilter } from './smoothing.js';
import { morphology } from './morphology.js';
import { clahe, canny, adaptiveThreshold } from './advanced.js';
self.onmessage = event => {
  const { width, height, data, category, method, size, shape, edge, low, high } = event.data;
  try {
    const source = new ImageData(new Uint8ClampedArray(data), width, height);
    let result;
    if (category === 'smooth') result = method === 'median' ? medianFilter(source, size, edge) : separableFilter(source, method, size, edge);
    else if (category === 'morph') result = morphology(source, method, size, shape, edge);
    else if (method === 'clahe') result = clahe(source, 64, 2);
    else if (method === 'canny') result = canny(source, low, high);
    else result = adaptiveThreshold(source, size, 7);
    self.postMessage({ width: result.width, height: result.height, data: result.data }, [result.data.buffer]);
  } catch (error) { self.postMessage({ error: String(error) }); }
};
